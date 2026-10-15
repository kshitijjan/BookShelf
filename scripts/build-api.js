import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

console.log('[build-api] Bundling src/server/vercelEntry.ts with esbuild API...');
const result = esbuild.buildSync({
  entryPoints: ['src/server/vercelEntry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['@prisma/client'],
  write: false,
});

const bundleContent = result.outputFiles[0].text;

const routes = [
  'api/[...path].js',
  'api/index.js',
  'api/circles.js',
  'api/circles/join.js',
  'api/margin-notes.js',
  'api/margin-notes/like.js',
  'api/margin-notes/comment.js',
  'api/profile.js',
  'api/profile/shelf.js',
  'api/books/daily.js',
  'api/books/daily/refresh.js',
  'api/books/daily/status.js',
  'api/cover-lookup.js',
  'api/cover-proxy.js',
  'api/archivist/consult.js',
];

for (const route of routes) {
  const dir = path.dirname(route);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(route, bundleContent, 'utf8');
}

console.log(`[build-api] Successfully generated ${routes.length} self-contained Vercel serverless endpoints.`);
