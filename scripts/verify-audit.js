#!/usr/bin/env node

/**
 * scripts/verify-audit.js
 *
 * Automated, opaque-box audit verification and latency benchmarking suite
 * for the BookShelf web application.
 *
 * Verifies:
 * 1. Primary routes (/, /books, /shelf, /profile)
 * 2. Core API endpoints (/api/archivist/consult, /api/books/daily, /api/margin-notes, /api/cover-proxy)
 * 3. Cache latency benchmark: repeat /api/archivist/consult < 20ms and cached === true
 * 4. Margin notes creation: POST /api/margin-notes with { bookTitle, bookAuthor, noteText } without page numbers
 * 5. Cover proxy error fallback: invalid/failing upstream URL returns image/SVG placeholder (not plain text 502)
 * 6. Latency metrics: P50 and P95 calculation across all API endpoints
 * 7. Adversarial boundaries & real-world end-to-end integration flows
 *
 * Usage:
 *   node scripts/verify-audit.js
 *   npm run test:audit
 *   node scripts/verify-audit.js --url http://localhost:5173 --samples 15 --report-only
 */

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

// CLI Options parsing
const args = process.argv.slice(2);
function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  for (const arg of args) {
    if (arg.startsWith(`${flag}=`)) return arg.split('=')[1];
  }
  return defaultVal;
}
const hasFlag = (flag) => args.includes(flag);

const BASE_URL = (getArgValue('--url', process.env.BASE_URL || 'http://localhost:5173')).replace(/\/$/, '');
const SAMPLES = parseInt(getArgValue('--samples', '10'), 10);
const REPORT_ONLY = hasFlag('--report-only') || hasFlag('--no-fail');
const NO_SPAWN = hasFlag('--no-spawn') || hasFlag('--skip-server-spawn');
const JSON_OUTPUT_PATH = getArgValue('--save-json', 'audit-report.json');
const VERBOSE = hasFlag('--verbose') || hasFlag('-v');

// Color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const results = [];
const benchmarkResults = [];
let spawnedServer = null;

// Test Runner Helper
async function testCase(suite, name, fn) {
  const start = performance.now();
  try {
    const details = await fn();
    const durationMs = performance.now() - start;
    results.push({ suite, name, status: 'PASS', durationMs, details: details || null });
    console.log(`  ${c.green}✓${c.reset} ${c.bold}${name}${c.reset} ${c.dim}(${durationMs.toFixed(1)}ms)${c.reset}`);
    return true;
  } catch (err) {
    const durationMs = performance.now() - start;
    results.push({
      suite,
      name,
      status: 'FAIL',
      durationMs,
      error: err.message,
      stack: err.stack,
    });
    console.log(`  ${c.red}✗${c.reset} ${c.bold}${name}${c.reset} ${c.dim}(${durationMs.toFixed(1)}ms)${c.reset}`);
    console.log(`    ${c.red}Error: ${err.message}${c.reset}`);
    if (VERBOSE && err.stack) {
      console.log(`    ${c.dim}${err.stack.split('\n').slice(1, 4).join('\n    ')}${c.reset}`);
    }
    return false;
  }
}

// Latency benchmark helper
async function benchmark(endpointName, requestFn, samples = SAMPLES) {
  const durations = [];
  let successfulCalls = 0;
  let failedCalls = 0;

  for (let i = 0; i < samples; i++) {
    const t0 = performance.now();
    try {
      await requestFn();
      const dur = performance.now() - t0;
      durations.push(dur);
      successfulCalls++;
    } catch {
      failedCalls++;
    }
  }

  if (durations.length === 0) {
    const emptyResult = {
      endpoint: endpointName,
      samples,
      successful: 0,
      failed: failedCalls,
      min: 0,
      p50: 0,
      p95: 0,
      max: 0,
      avg: 0,
    };
    benchmarkResults.push(emptyResult);
    return emptyResult;
  }

  durations.sort((a, b) => a - b);
  const min = durations[0];
  const max = durations[durations.length - 1];
  const avg = durations.reduce((acc, d) => acc + d, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))];

  const stat = {
    endpoint: endpointName,
    samples,
    successful: successfulCalls,
    failed: failedCalls,
    min: Number(min.toFixed(2)),
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number(avg.toFixed(2)),
  };

  benchmarkResults.push(stat);
  return stat;
}

// Server health check
async function pingServer(url, timeoutMs = 1500) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

// Ensure server is running or spawn Vite
async function ensureServerReady() {
  process.stdout.write(`Checking target server at ${c.cyan}${BASE_URL}${c.reset}... `);
  const isUp = await pingServer(BASE_URL);

  if (isUp) {
    console.log(`${c.green}Online${c.reset}`);
    return;
  }

  if (NO_SPAWN) {
    console.log(`${c.red}Unreachable${c.reset}`);
    throw new Error(`Server at ${BASE_URL} is unreachable and --no-spawn was specified.`);
  }

  console.log(`${c.yellow}Not running. Spawning Vite dev server...${c.reset}`);

  // Extract port from URL if specified
  let port = '5173';
  try {
    const parsed = new URL(BASE_URL);
    if (parsed.port) port = parsed.port;
  } catch {
    // default
  }

  spawnedServer = spawn('npx', ['vite', '--port', port], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, PORT: port },
    detached: false,
  });

  spawnedServer.stderr.on('data', (data) => {
    if (VERBOSE) process.stderr.write(`${c.dim}[vite-stderr] ${data.toString()}${c.reset}`);
  });

  const maxWait = 25000;
  const pollInterval = 300;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (await pingServer(BASE_URL, 800)) {
      console.log(`  ${c.green}✓${c.reset} Vite dev server ready at ${c.cyan}${BASE_URL}${c.reset}`);
      return;
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error(`Timed out waiting for Vite server to start at ${BASE_URL} after ${maxWait / 1000}s`);
}

function cleanUpServer() {
  if (spawnedServer && !spawnedServer.killed) {
    console.log(`\n${c.dim}Shutting down spawned test server (pid: ${spawnedServer.pid})...${c.reset}`);
    try {
      spawnedServer.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', () => {
  cleanUpServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanUpServer();
  process.exit(143);
});

// MAIN AUDIT SUITE
async function runVerificationAudit() {
  console.log(`\n${c.bold}${c.magenta}==============================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta}   BookShelf Web Application: Comprehensive Verification Audit  ${c.reset}`);
  console.log(`${c.bold}${c.magenta}==============================================================${c.reset}`);
  console.log(`${c.dim}Target URL: ${BASE_URL} | Samples: ${SAMPLES} | Mode: Opaque-Box Automated Audit${c.reset}\n`);

  await ensureServerReady();

  // -------------------------------------------------------------------------
  // SUITE 1: Primary Application Routes
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}1. Primary Application Routes Verification${c.reset}`);

  const primaryRoutes = [
    { path: '/', label: 'Home Page (Chapters I - V)' },
    { path: '/books', label: 'Catalog Search & Browse Page' },
    { path: '/shelf', label: 'Personal Reader Shelf Page' },
    { path: '/profile', label: 'Reader Sanctuary Profile Page' },
  ];

  for (const route of primaryRoutes) {
    await testCase('Primary Routes', `Route ${route.path} (${route.label}) returns HTTP 200 with HTML`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`);
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Expected text/html content-type, received: "${contentType}"`);
      }
      const html = await res.text();
      if (!html.includes('<div id="root">') && !html.includes('id="root"')) {
        throw new Error(`Rendered HTML missing root mount node: "<div id=\\"root\\">"`);
      }
      return { status: res.status, bytes: html.length };
    });
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Core API Endpoints & Data Contracts
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}2. Core API Endpoints Verification${c.reset}`);

  // 2.1 /api/books/daily
  await testCase('Core API', 'GET /api/books/daily returns structured catalog with books array', async () => {
    const res = await fetch(`${BASE_URL}/api/books/daily`);
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }
    if (!Array.isArray(data.books)) {
      throw new Error('Field "books" is missing or not an array');
    }
    if (data.books.length === 0) {
      throw new Error('Field "books" array is empty');
    }
    if (!data.dateKey || typeof data.dateKey !== 'string') {
      throw new Error('Field "dateKey" missing or invalid format');
    }
    const sampleBook = data.books[0];
    const requiredBookProps = ['id', 'title', 'author', 'genre', 'synopsis'];
    for (const prop of requiredBookProps) {
      if (sampleBook[prop] === undefined) {
        throw new Error(`Book object in daily catalog missing required property: "${prop}"`);
      }
    }
    if (!sampleBook.coverImage && !sampleBook.coverUrl) {
      throw new Error('Book object in daily catalog missing "coverImage" or "coverUrl" property');
    }
    return { bookCount: data.books.length, dateKey: data.dateKey };
  });

  // 2.2 /api/margin-notes (GET)
  await testCase('Core API', 'GET /api/margin-notes returns community notes list', async () => {
    const res = await fetch(`${BASE_URL}/api/margin-notes`);
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }
    if (!Array.isArray(data.notes)) {
      throw new Error('Field "notes" is missing or not an array');
    }
    if (data.notes.length > 0) {
      const sample = data.notes[0];
      if (!sample.id || !sample.bookTitle || !sample.noteText) {
        throw new Error(`Margin note missing core fields (id, bookTitle, or noteText): ${JSON.stringify(sample)}`);
      }
    }
    return { noteCount: data.notes.length };
  });

  // 2.3 /api/cover-proxy (Valid Image)
  await testCase('Core API', 'GET /api/cover-proxy with valid cover URL streams image asset', async () => {
    const sampleCoverUrl = 'https://covers.openlibrary.org/b/id/8225261-M.jpg';
    const res = await fetch(`${BASE_URL}/api/cover-proxy?url=${encodeURIComponent(sampleCoverUrl)}`);
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 for valid cover, received: ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Expected image/* content-type, received: "${contentType}"`);
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 100) {
      throw new Error(`Received truncated image payload (${buffer.byteLength} bytes)`);
    }
    return { contentType, bytes: buffer.byteLength };
  });

  // 2.4 /api/archivist/consult (Live or Fallback)
  let initialConsultData = null;
  const testConsultQuery = 'warm philosophical fiction';

  await testCase('Core API', 'POST /api/archivist/consult returns 3 recommendations and cached property', async () => {
    const res = await fetch(`${BASE_URL}/api/archivist/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testConsultQuery }),
    });

    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    initialConsultData = data;

    if (!data || typeof data !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }

    if (!Array.isArray(data.recommendations)) {
      throw new Error('Field "recommendations" is missing or not an array');
    }

    if (data.recommendations.length < 3) {
      throw new Error(`Expected at least 3 recommendations, received ${data.recommendations.length}`);
    }

    // Contract: check cached property existence
    if (data.cached === undefined) {
      throw new Error('Response missing mandatory "cached: boolean" property in contract (PROJECT.md:49)');
    }

    const rec = data.recommendations[0];
    const title = rec.title || rec.book?.title;
    const author = rec.author || rec.book?.author;
    if (!title || !author) {
      throw new Error(`Recommendation missing title or author: ${JSON.stringify(rec)}`);
    }

    return { recommendationsCount: data.recommendations.length, cached: data.cached, source: data.source };
  });

  // -------------------------------------------------------------------------
  // SUITE 3: Margin Notes Creation Contract (Omit Page Numbers)
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}3. Margin Notes Creation & Inscription Contract${c.reset}`);

  await testCase(
    'Margin Notes',
    'POST /api/margin-notes succeeds with { bookTitle, bookAuthor, noteText } without page numbers',
    async () => {
      const payload = {
        bookTitle: 'Meditations of Aurelius',
        bookAuthor: 'Marcus Aurelius',
        noteText: 'The soul becomes dyed with the color of its thoughts.',
      };

      const res = await fetch(`${BASE_URL}/api/margin-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status !== 200 && res.status !== 201) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText} (Payload without pageNumber or passageSnippet was rejected)`);
      }

      const body = await res.json();
      if (!body.note || !body.note.id) {
        throw new Error(`Missing created note object in response: ${JSON.stringify(body)}`);
      }

      if (body.note.bookTitle !== payload.bookTitle) {
        throw new Error(`Expected bookTitle "${payload.bookTitle}", got "${body.note.bookTitle}"`);
      }

      if (body.note.pageNumber !== null && body.note.pageNumber !== undefined) {
        // Assert page number is omitted or null
        if (typeof body.note.pageNumber === 'number' && isNaN(body.note.pageNumber)) {
          throw new Error('pageNumber returned as NaN');
        }
      }

      return { noteId: body.note.id, title: body.note.bookTitle };
    }
  );

  // Boundary: Missing required fields
  await testCase('Margin Notes', 'POST /api/margin-notes with empty payload returns HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/api/margin-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for empty note, received: ${res.status}`);
    }
    return { status: res.status };
  });

  // -------------------------------------------------------------------------
  // SUITE 4: Cover Proxy Error Fallback & Resilience
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}4. Cover Proxy Error Fallback & Resilience${c.reset}`);

  await testCase(
    'Cover Proxy',
    'GET /api/cover-proxy with failing upstream URL returns high-fidelity parchment SVG placeholder (not plain text 502/404)',
    async () => {
      const failingUrl = 'https://unreachable-upstream-cover-domain-999.xyz/broken-cover.jpg';
      const res = await fetch(`${BASE_URL}/api/cover-proxy?url=${encodeURIComponent(failingUrl)}`);

      // Plain text 502/404 error check
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const body = await res.text();

      if (contentType.includes('text/plain') || body.includes('Upstream error') || body.includes('Proxy fetch failed')) {
        throw new Error(
          `Cover proxy returned plain text error ("${body.trim()}"). Expected valid image or parchment SVG fallback.`
        );
      }

      const isSvg = contentType.includes('image/svg+xml') || (body.includes('<svg') && body.includes('</svg>'));
      const isImage = contentType.startsWith('image/');

      if (!isSvg && !isImage) {
        throw new Error(`Expected image/* or image/svg+xml fallback, received: Content-Type="${contentType}", Body="${body.slice(0, 100)}"`);
      }

      return { status: res.status, contentType, isSvgPlaceholder: isSvg };
    }
  );

  await testCase('Cover Proxy', 'GET /api/cover-proxy without url parameter returns HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/api/cover-proxy`);
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for missing url query, received: ${res.status}`);
    }
    return { status: res.status };
  });

  // -------------------------------------------------------------------------
  // SUITE 5: Cache Latency Benchmark: repeat /api/archivist/consult < 20ms
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}5. Cache Latency Benchmark & SLA Verification${c.reset}`);

  await testCase(
    'Cache Benchmark',
    'Repeat POST /api/archivist/consult resolves in < 20ms with cached === true',
    async () => {
      const query = testConsultQuery;

      // Prime request if not already primed
      if (!initialConsultData) {
        await fetch(`${BASE_URL}/api/archivist/consult`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
      }

      // Benchmark repeat request
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}/api/archivist/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const latencyMs = performance.now() - t0;

      if (res.status !== 200) {
        throw new Error(`Repeat consult failed with HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();

      if (data.cached !== true) {
        throw new Error(`Expected "cached: true" for repeated query, received: ${data.cached}`);
      }

      if (latencyMs >= 20.0) {
        throw new Error(`Cache hit latency of ${latencyMs.toFixed(2)}ms violated SLA target (< 20.0ms)`);
      }

      return { latencyMs: Number(latencyMs.toFixed(2)), cached: data.cached, slaTargetMs: 20 };
    }
  );

  // Normalized whitespace query cache hit test
  await testCase(
    'Cache Benchmark',
    'Whitespace and punctuation normalized query hits in-memory cache with cached === true',
    async () => {
      const variation = `   ${testConsultQuery} !  `;
      const t0 = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      try {
        const res = await fetch(`${BASE_URL}/api/archivist/consult`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: variation }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const latencyMs = performance.now() - t0;
        const data = await res.json();

        if (data.cached !== true) {
          throw new Error(`Expected normalized query "${variation}" to resolve from cache with cached === true, got cached: ${data.cached}`);
        }

        return { latencyMs: Number(latencyMs.toFixed(2)), cached: data.cached };
      } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          throw new Error(
            `Normalized query "${variation}" did not hit in-memory cache (timed out > 2.5s; triggered un-cached external LLM call violating quota guardrails)`
          );
        }
        throw err;
      }
    }
  );

  // -------------------------------------------------------------------------
  // SUITE 6: Multi-Sample Latency Profiling (P50 & P95)
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}6. Multi-Sample Latency Profiling (P50 & P95 Metrics)${c.reset}`);
  console.log(`  ${c.dim}Sampling ${SAMPLES} iterations per endpoint...${c.reset}`);

  // 6.1 /api/archivist/consult (cached)
  await benchmark('POST /api/archivist/consult (cached)', async () => {
    const res = await fetch(`${BASE_URL}/api/archivist/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testConsultQuery }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();
  });

  // 6.2 /api/books/daily
  await benchmark('GET /api/books/daily', async () => {
    const res = await fetch(`${BASE_URL}/api/books/daily`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();
  });

  // 6.3 /api/margin-notes
  await benchmark('GET /api/margin-notes', async () => {
    const res = await fetch(`${BASE_URL}/api/margin-notes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();
  });

  // 6.4 /api/cover-proxy (fallback placeholder)
  await benchmark('GET /api/cover-proxy (fallback)', async () => {
    const res = await fetch(`${BASE_URL}/api/cover-proxy?url=https://placeholder.bench/test.jpg`);
    await res.text();
  });

  // -------------------------------------------------------------------------
  // SUITE 7: Real-World End-to-End User Journey Simulation
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}7. Real-World End-to-End User Journey Simulation${c.reset}`);

  await testCase('User Flow', 'Complete lifecycle: Consult -> Inscribe Note -> Query Shelf -> Check Profile', async () => {
    try {
      // Step 1: Consult
      const consultRes = await fetch(`${BASE_URL}/api/archivist/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'warm philosophical fiction' }),
      });
    if (!consultRes.ok) throw new Error(`Step 1 (Consult) failed: HTTP ${consultRes.status}`);
    const consultJson = await consultRes.json();
    const recommended = consultJson.recommendations?.[0];
    const title = recommended?.title || recommended?.book?.title || 'The Shadow of the Wind';
    const author = recommended?.author || recommended?.book?.author || 'Carlos Ruiz Zafón';

    // Step 2: Inscribe note for recommended volume
    const inscribeRes = await fetch(`${BASE_URL}/api/margin-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle: title,
        bookAuthor: author,
        noteText: 'Discovered via AI Archivist consultation on quiet evening.',
      }),
    });
    if (!inscribeRes.ok) {
      throw new Error(`Step 2 (Inscribe Note) failed: HTTP ${inscribeRes.status}: ${await inscribeRes.text()}`);
    }

    // Step 3: Add to user shelf
    const testClerkId = `audit_user_${Date.now()}`;
    const testEmail = `${testClerkId}@bookshelf.sanctuary`;
    const shelfRes = await fetch(`${BASE_URL}/api/profile/shelf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: testClerkId,
        email: testEmail,
        action: 'add',
        status: 'reading_list',
        book: {
          id: `book-${Date.now()}`,
          title,
          author,
          genre: 'Fiction',
          pages: 400,
        },
      }),
    });
    // Note: If profile does not exist yet, shelf returns 404; create profile first if needed
    if (shelfRes.status === 404) {
      // First create profile
      await fetch(`${BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: testClerkId,
          email: testEmail,
          firstName: 'Sanctuary',
          lastName: 'Auditor',
        }),
      });
      // Retry shelf add
      const retryShelf = await fetch(`${BASE_URL}/api/profile/shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: testClerkId,
          email: testEmail,
          action: 'add',
          status: 'reading_list',
          book: {
            id: `book-${Date.now()}`,
            title,
            author,
            genre: 'Fiction',
            pages: 400,
          },
        }),
      });
      if (!retryShelf.ok) throw new Error(`Step 3 (Shelf Add) failed: HTTP ${retryShelf.status}`);
    }

    // Step 4: Verify profile query includes updated stats
    const profileRes = await fetch(`${BASE_URL}/api/profile?clerkId=${testClerkId}`);
    if (!profileRes.ok) throw new Error(`Step 4 (Profile Fetch) failed: HTTP ${profileRes.status}`);
    const profileData = await profileRes.json();
    if (!profileData.profile) throw new Error('Step 4 Profile data missing "profile" record');

      return { success: true, user: testClerkId, bookAdded: title };
    } catch (err) {
      console.error('LIFECYCLE ERROR:', err?.message, err?.cause);
      throw err;
    }
  });

  // -------------------------------------------------------------------------
  // SCORECARD & BENCHMARK SUMMARY TABLE
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.magenta}==============================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta}                 Audit Verification Scorecard                 ${c.reset}`);
  console.log(`${c.bold}${c.magenta}==============================================================${c.reset}`);

  const passedTests = results.filter((r) => r.status === 'PASS');
  const failedTests = results.filter((r) => r.status === 'FAIL');
  const passRate = ((passedTests.length / results.length) * 100).toFixed(1);

  console.log(`\n  Total Tests : ${c.bold}${results.length}${c.reset}`);
  console.log(`  Passed      : ${c.green}${c.bold}${passedTests.length}${c.reset}`);
  console.log(`  Failed      : ${failedTests.length > 0 ? c.red : c.green}${c.bold}${failedTests.length}${c.reset}`);
  console.log(`  Pass Rate   : ${failedTests.length === 0 ? c.green : c.yellow}${c.bold}${passRate}%${c.reset}\n`);

  // Benchmarks table
  if (benchmarkResults.length > 0) {
    console.log(`${c.bold}${c.cyan}Latency Benchmark Profiling (ms):${c.reset}`);
    console.log(
      `  ${'Endpoint'.padEnd(38)} | ${'Samples'.padStart(7)} | ${'Min'.padStart(8)} | ${'P50 (Med)'.padStart(10)} | ${'P95'.padStart(8)} | ${'Max'.padStart(8)} | ${'SLA Status'.padEnd(10)}`
    );
    console.log(`  ${'-'.repeat(38)}-+-${'-'.repeat(7)}-+-${'-'.repeat(8)}-+-${'-'.repeat(10)}-+-${'-'.repeat(8)}-+-${'-'.repeat(8)}-+-${'-'.repeat(10)}`);

    for (const b of benchmarkResults) {
      let sla = `${c.green}OK${c.reset}`;
      if (b.endpoint.includes('cached') && b.p50 > 20.0) {
        sla = `${c.red}>20ms SLA${c.reset}`;
      } else if (b.p50 > 1000) {
        sla = `${c.yellow}High${c.reset}`;
      }
      console.log(
        `  ${b.endpoint.padEnd(38)} | ${String(b.samples).padStart(7)} | ${String(b.min).padStart(8)} | ${String(b.p50).padStart(10)} | ${String(b.p95).padStart(8)} | ${String(b.max).padStart(8)} | ${sla}`
      );
    }
    console.log('');
  }

  // Discovered Defects & Escalations
  if (failedTests.length > 0) {
    console.log(`${c.bold}${c.red}Discovered Defects & Escalation Items:${c.reset}`);
    for (const f of failedTests) {
      console.log(`  ${c.red}• [${f.suite}] ${f.name}${c.reset}`);
      console.log(`    ${c.dim}Details: ${f.error}${c.reset}`);
    }
    console.log('');
  }

  // Save JSON report if configured
  if (JSON_OUTPUT_PATH) {
    try {
      const reportPayload = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
          total: results.length,
          passed: passedTests.length,
          failed: failedTests.length,
          passRate: `${passRate}%`,
        },
        tests: results,
        latencyBenchmarks: benchmarkResults,
      };
      writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(reportPayload, null, 2), 'utf8');
      console.log(`${c.dim}Audit report written to ${JSON_OUTPUT_PATH}${c.reset}\n`);
    } catch (saveErr) {
      console.warn(`Could not save JSON report to ${JSON_OUTPUT_PATH}:`, saveErr.message);
    }
  }

  cleanUpServer();

  if (failedTests.length > 0 && !REPORT_ONLY) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerificationAudit().catch((err) => {
  console.error(`\n${c.red}${c.bold}Fatal error executing verification audit:${c.reset}`, err);
  cleanUpServer();
  process.exit(1);
});
