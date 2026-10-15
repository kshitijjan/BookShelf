// src/server/apiHandler.ts
import { PrismaClient } from "@prisma/client";

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/constants.mjs
var DEV_OR_STAGING_SUFFIXES = [
  ".lcl.dev",
  ".stg.dev",
  ".lclstage.dev",
  ".stgstage.dev",
  ".dev.lclclerk.com",
  ".stg.lclclerk.com",
  ".accounts.lclclerk.com",
  "accountsstage.dev",
  "accounts.dev"
];

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/_chunks/keySetupGuidance-NjzfRCzi.mjs
var existingAppSteps = `To use an existing Clerk app, run:
npx clerk@latest link
npx clerk@latest env pull

For production keys, run:
npx clerk@latest env pull --instance prod`;
var dashboardFallback = `Or copy keys from https://dashboard.clerk.com/~/api-keys into your .env file.`;
var keySetupGuidance = `To create a new Clerk app, run:
npx clerk@latest init

'npx clerk@latest init' does not need a Clerk account and writes temporary dev keys.

${existingAppSteps}

${dashboardFallback}`;
var existingAppKeyGuidance = `${existingAppSteps}

${dashboardFallback}`;

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/isomorphicAtob.mjs
var isomorphicAtob = (data) => {
  if (typeof atob !== "undefined" && typeof atob === "function") return atob(data);
  else if (typeof globalThis.Buffer !== "undefined") return globalThis.Buffer.from(data, "base64").toString();
  return data;
};

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/keys.mjs
function createDevOrStagingUrlCache() {
  const devOrStagingUrlCache = /* @__PURE__ */ new Map();
  return {
    /**
    * Checks if a URL is a development or staging environment.
    *
    * @param url - The URL to check (string or URL object).
    * @returns `true` if the URL is a development or staging environment, `false` otherwise.
    */
    isDevOrStagingUrl: (url) => {
      if (!url) return false;
      const hostname = typeof url === "string" ? url : url.hostname;
      let res = devOrStagingUrlCache.get(hostname);
      if (res === void 0) {
        res = DEV_OR_STAGING_SUFFIXES.some((s) => hostname.endsWith(s));
        devOrStagingUrlCache.set(hostname, res);
      }
      return res;
    }
  };
}

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/retry.mjs
var defaultOptions = {
  initialDelay: 125,
  maxDelayBetweenRetries: 0,
  factor: 2,
  shouldRetry: (_, iteration) => iteration < 5,
  retryImmediately: false,
  jitter: true
};
var RETRY_IMMEDIATELY_DELAY = 100;
var sleep = async (ms) => new Promise((s) => setTimeout(s, ms));
var applyJitter = (delay, jitter) => {
  return jitter ? delay * (1 + Math.random()) : delay;
};
var createExponentialDelayAsyncFn = (opts) => {
  let timesCalled = 0;
  const calculateDelayInMs = () => {
    const constant = opts.initialDelay;
    const base = opts.factor;
    let delay = constant * Math.pow(base, timesCalled);
    delay = applyJitter(delay, opts.jitter);
    return Math.min(opts.maxDelayBetweenRetries || delay, delay);
  };
  return async () => {
    await sleep(calculateDelayInMs());
    timesCalled++;
  };
};
var retry = async (callback, options = {}) => {
  let iterations = 0;
  const { shouldRetry, initialDelay, maxDelayBetweenRetries, factor, retryImmediately, jitter, onBeforeRetry } = {
    ...defaultOptions,
    ...options
  };
  const delay = createExponentialDelayAsyncFn({
    initialDelay,
    maxDelayBetweenRetries,
    factor,
    jitter
  });
  while (true) try {
    return await callback();
  } catch (e) {
    iterations++;
    if (!shouldRetry(e, iterations)) throw e;
    if (onBeforeRetry) await onBeforeRetry(iterations);
    if (retryImmediately && iterations === 1) await sleep(applyJitter(RETRY_IMMEDIATELY_DELAY, jitter));
    else await delay();
  }
};

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/url.mjs
var createDynamicParamParser = ({ regex }) => ({ urlWithParam, entity }) => {
  const match2 = regex.exec(urlWithParam);
  if (match2) {
    const key = match2[1];
    if (key in entity) {
      const value = entity[key];
      return urlWithParam.replace(match2[0], value);
    }
  }
  return urlWithParam;
};
var populateParamFromObject = createDynamicParamParser({ regex: /:(\w+)/ });

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/_chunks/clerkRuntimeError-DlesLWqO.mjs
function createErrorTypeGuard(ErrorClass) {
  function typeGuard(error) {
    const target = error ?? this;
    if (!target) throw new TypeError(`${ErrorClass.kind || ErrorClass.name} type guard requires an error object`);
    if (ErrorClass.kind && typeof target === "object" && target !== null && "constructor" in target) {
      if (target.constructor?.kind === ErrorClass.kind) return true;
    }
    return target instanceof ErrorClass;
  }
  return typeGuard;
}
var ClerkError = class ClerkError2 extends Error {
  static kind = "ClerkError";
  clerkError = true;
  code;
  longMessage;
  docsUrl;
  cause;
  get name() {
    return this.constructor.name;
  }
  constructor(opts) {
    super(new.target.formatMessage(new.target.kind, opts.message, opts.code, opts.docsUrl), { cause: opts.cause });
    Object.setPrototypeOf(this, ClerkError2.prototype);
    this.code = opts.code;
    this.docsUrl = opts.docsUrl;
    this.longMessage = opts.longMessage;
    this.cause = opts.cause;
  }
  toString() {
    return `[${this.name}]
Message:${this.message}`;
  }
  static formatMessage(name, msg, code, docsUrl) {
    const prefix = "Clerk:";
    const regex = new RegExp(prefix.replace(" ", "\\s*"), "i");
    msg = msg.replace(regex, "");
    msg = `${prefix} ${msg.trim()}

(code="${code}")

`;
    if (docsUrl) msg += `

Docs: ${docsUrl}`;
    return msg;
  }
};
var ClerkRuntimeError = class ClerkRuntimeError2 extends ClerkError {
  static kind = "ClerkRuntimeError";
  /**
  * @deprecated Use `clerkError` property instead. This property is maintained for backward compatibility.
  */
  clerkRuntimeError = true;
  constructor(message, options) {
    super({
      ...options,
      message
    });
    Object.setPrototypeOf(this, ClerkRuntimeError2.prototype);
  }
};
var isClerkRuntimeError = createErrorTypeGuard(ClerkRuntimeError);

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/_chunks/error-DXioMHds.mjs
var ClerkAPIError = class {
  static kind = "ClerkAPIError";
  code;
  message;
  longMessage;
  meta;
  constructor(json) {
    const parsedError = {
      code: json.code,
      message: json.message,
      longMessage: json.long_message,
      meta: {
        paramName: json.meta?.param_name,
        sessionId: json.meta?.session_id,
        emailAddresses: json.meta?.email_addresses,
        identifiers: json.meta?.identifiers,
        zxcvbn: json.meta?.zxcvbn,
        plan: json.meta?.plan,
        isPlanUpgradePossible: json.meta?.is_plan_upgrade_possible,
        seatsQuantityToAdd: json.meta?.seats_quantity_to_add,
        seatsQuantity: json.meta?.seats_quantity,
        traceId: json.meta?.trace_id,
        kind: json.meta?.kind,
        title: json.meta?.title,
        description: json.meta?.description,
        linkUrl: json.meta?.link_url,
        linkText: json.meta?.link_text,
        data: json.meta?.data
      }
    };
    this.code = parsedError.code;
    this.message = parsedError.message;
    this.longMessage = parsedError.longMessage;
    this.meta = parsedError.meta;
  }
};
var isClerkAPIError = createErrorTypeGuard(ClerkAPIError);
var ClerkAPIResponseError = class ClerkAPIResponseError2 extends ClerkError {
  static kind = "ClerkAPIResponseError";
  status;
  clerkTraceId;
  retryAfter;
  errors;
  constructor(message, options) {
    const { data: errorsJson, status, clerkTraceId, retryAfter } = options;
    super({
      ...options,
      message,
      code: "api_response_error"
    });
    Object.setPrototypeOf(this, ClerkAPIResponseError2.prototype);
    this.status = status;
    this.clerkTraceId = clerkTraceId;
    this.retryAfter = retryAfter;
    this.errors = (errorsJson || []).map((e) => new ClerkAPIError(e));
  }
  toString() {
    let message = `[${this.name}]
Message:${this.message}
Status:${this.status}
Serialized errors: ${this.errors.map((e) => JSON.stringify(e))}`;
    if (this.clerkTraceId) message += `
Clerk Trace ID: ${this.clerkTraceId}`;
    return message;
  }
  static formatMessage(name, msg, _, __) {
    return msg;
  }
};
var isClerkAPIResponseError = createErrorTypeGuard(ClerkAPIResponseError);
var DefaultMessages = Object.freeze({
  InvalidProxyUrlErrorMessage: `The proxyUrl passed to Clerk is invalid. The expected value for proxyUrl is an absolute URL or a relative path with a leading '/'. (key={{url}})`,
  InvalidPublishableKeyErrorMessage: `The publishableKey passed to Clerk is invalid (key={{key}}, expected format: pk_test_... or pk_live_...).

${keySetupGuidance}`,
  MissingPublishableKeyErrorMessage: `Clerk keys are missing from your environment.

${keySetupGuidance}`,
  MissingSecretKeyErrorMessage: `Missing secretKey.

${existingAppKeyGuidance}`,
  MissingClerkProvider: `{{source}} can only be used within the <ClerkProvider /> component. Learn more: https://clerk.com/docs/components/clerk-provider`
});
function buildErrorThrower({ packageName, customMessages }) {
  let pkg = packageName;
  function buildMessage(rawMessage, replacements) {
    if (!replacements) return `${pkg}: ${rawMessage}`;
    let msg = rawMessage;
    const matches = rawMessage.matchAll(/{{([a-zA-Z0-9-_]+)}}/g);
    for (const match2 of matches) {
      const replacement = (replacements[match2[1]] || "").toString();
      msg = msg.replace(`{{${match2[1]}}}`, replacement);
    }
    return `${pkg}: ${msg}`;
  }
  const messages = {
    ...DefaultMessages,
    ...customMessages
  };
  return {
    setPackageName({ packageName: packageName2 }) {
      if (typeof packageName2 === "string") pkg = packageName2;
      return this;
    },
    setMessages({ customMessages: customMessages2 }) {
      Object.assign(messages, customMessages2 || {});
      return this;
    },
    throwInvalidPublishableKeyError(params) {
      throw new Error(buildMessage(messages.InvalidPublishableKeyErrorMessage, params));
    },
    throwInvalidProxyUrl(params) {
      throw new Error(buildMessage(messages.InvalidProxyUrlErrorMessage, params));
    },
    throwMissingPublishableKeyError() {
      throw new Error(buildMessage(messages.MissingPublishableKeyErrorMessage));
    },
    throwMissingSecretKeyError() {
      throw new Error(buildMessage(messages.MissingSecretKeyErrorMessage));
    },
    throwMissingClerkProviderError(params) {
      throw new Error(buildMessage(messages.MissingClerkProvider, params));
    },
    throw(message) {
      throw new Error(buildMessage(message));
    }
  };
}

// node_modules/@clerk/backend/dist/chunk-YBVFDYDR.mjs
var errorThrower = buildErrorThrower({ packageName: "@clerk/backend" });
var { isDevOrStagingUrl } = createDevOrStagingUrlCache();

// node_modules/@clerk/backend/dist/chunk-RZ7A7F6X.mjs
var TokenVerificationErrorCode = {
  InvalidSecretKey: "clerk_key_invalid"
};
var TokenVerificationErrorReason = {
  TokenExpired: "token-expired",
  TokenInvalid: "token-invalid",
  TokenInvalidAlgorithm: "token-invalid-algorithm",
  TokenInvalidAuthorizedParties: "token-invalid-authorized-parties",
  TokenInvalidSignature: "token-invalid-signature",
  TokenNotActiveYet: "token-not-active-yet",
  TokenIatInTheFuture: "token-iat-in-the-future",
  TokenVerificationFailed: "token-verification-failed",
  InvalidSecretKey: "secret-key-invalid",
  LocalJWKMissing: "jwk-local-missing",
  RemoteJWKFailedToLoad: "jwk-remote-failed-to-load",
  RemoteJWKInvalid: "jwk-remote-invalid",
  RemoteJWKMissing: "jwk-remote-missing",
  JWKFailedToResolve: "jwk-failed-to-resolve",
  JWKKidMismatch: "jwk-kid-mismatch"
};
var TokenVerificationErrorAction = {
  ContactSupport: "Contact support@clerk.com",
  EnsureClerkJWT: "Make sure that this is a valid Clerk-generated JWT.",
  SetClerkJWTKey: "Set the CLERK_JWT_KEY environment variable.",
  SetClerkSecretKey: "Set the CLERK_SECRET_KEY environment variable.",
  EnsureClockSync: "Make sure your system clock is in sync (e.g. turn off and on automatic time synchronization)."
};
var TokenVerificationError = class _TokenVerificationError extends Error {
  constructor({
    action,
    message,
    reason
  }) {
    super(message);
    Object.setPrototypeOf(this, _TokenVerificationError.prototype);
    this.reason = reason;
    this.message = message;
    this.action = action;
  }
  getFullMessage() {
    return `${[this.message, this.action].filter((m) => m).join(" ")} (reason=${this.reason}, token-carrier=${this.tokenCarrier})`;
  }
};
var MachineTokenVerificationErrorCode = {
  TokenInvalid: "token-invalid",
  InvalidSecretKey: "secret-key-invalid",
  UnexpectedError: "unexpected-error",
  TokenVerificationFailed: "token-verification-failed"
};
var _MachineTokenVerificationError = class _MachineTokenVerificationError2 extends ClerkError {
  constructor({
    message,
    code,
    status,
    action
  }) {
    super({ message, code });
    Object.setPrototypeOf(this, _MachineTokenVerificationError2.prototype);
    this.status = status;
    this.action = action;
  }
  // Keep message unformatted, matching ClerkAPIResponseError's approach
  static formatMessage(_name, msg, _code, _docsUrl) {
    return msg;
  }
  getFullMessage() {
    return `${this.message} (code=${this.code}, status=${this.status || "n/a"})`;
  }
};
_MachineTokenVerificationError.kind = "MachineTokenVerificationError";
var MachineTokenVerificationError = _MachineTokenVerificationError;

// node_modules/@clerk/backend/dist/runtime/node/crypto.mjs
import { webcrypto } from "node:crypto";

// node_modules/@clerk/backend/dist/chunk-OBKCLPTQ.mjs
var globalFetch = fetch.bind(globalThis);
var runtime = {
  crypto: webcrypto,
  get fetch() {
    return process.env.NODE_ENV === "test" ? fetch : globalFetch;
  },
  AbortController: globalThis.AbortController,
  Blob: globalThis.Blob,
  FormData: globalThis.FormData,
  Headers: globalThis.Headers,
  Request: globalThis.Request,
  Response: globalThis.Response
};
var base64url = {
  parse(string, opts) {
    return parse(string, base64UrlEncoding, opts);
  },
  stringify(data, opts) {
    return stringify(data, base64UrlEncoding, opts);
  }
};
var base64UrlEncoding = {
  chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  bits: 6
};
function parse(string, encoding, opts = {}) {
  if (!encoding.codes) {
    encoding.codes = {};
    for (let i = 0; i < encoding.chars.length; ++i) {
      encoding.codes[encoding.chars[i]] = i;
    }
  }
  if (!opts.loose && string.length * encoding.bits & 7) {
    throw new SyntaxError("Invalid padding");
  }
  let end = string.length;
  while (string[end - 1] === "=") {
    --end;
    if (!opts.loose && !((string.length - end) * encoding.bits & 7)) {
      throw new SyntaxError("Invalid padding");
    }
  }
  const out = new (opts.out ?? Uint8Array)(end * encoding.bits / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i = 0; i < end; ++i) {
    const value = encoding.codes[string[i]];
    if (value === void 0) {
      throw new SyntaxError("Invalid character " + string[i]);
    }
    buffer = buffer << encoding.bits | value;
    bits += encoding.bits;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = 255 & buffer >> bits;
    }
  }
  if (bits >= encoding.bits || 255 & buffer << 8 - bits) {
    throw new SyntaxError("Unexpected end of data");
  }
  return out;
}
function stringify(data, encoding, opts = {}) {
  const { pad = true } = opts;
  const mask = (1 << encoding.bits) - 1;
  let out = "";
  let bits = 0;
  let buffer = 0;
  for (let i = 0; i < data.length; ++i) {
    buffer = buffer << 8 | 255 & data[i];
    bits += 8;
    while (bits > encoding.bits) {
      bits -= encoding.bits;
      out += encoding.chars[mask & buffer >> bits];
    }
  }
  if (bits) {
    out += encoding.chars[mask & buffer << encoding.bits - bits];
  }
  if (pad) {
    while (out.length * encoding.bits & 7) {
      out += "=";
    }
  }
  return out;
}
var algToHash = {
  RS256: "SHA-256",
  RS384: "SHA-384",
  RS512: "SHA-512"
};
var RSA_ALGORITHM_NAME = "RSASSA-PKCS1-v1_5";
var jwksAlgToCryptoAlg = {
  RS256: RSA_ALGORITHM_NAME,
  RS384: RSA_ALGORITHM_NAME,
  RS512: RSA_ALGORITHM_NAME
};
var algs = Object.keys(algToHash);
function getCryptoAlgorithm(algorithmName) {
  const hash = algToHash[algorithmName];
  const name = jwksAlgToCryptoAlg[algorithmName];
  if (!hash || !name) {
    throw new Error(`Unsupported algorithm ${algorithmName}, expected one of ${algs.join(",")}.`);
  }
  return {
    hash: { name: algToHash[algorithmName] },
    name: jwksAlgToCryptoAlg[algorithmName]
  };
}
var isArrayString = (s) => {
  return Array.isArray(s) && s.length > 0 && s.every((a) => typeof a === "string");
};
var assertAudienceClaim = (aud, audience) => {
  const audienceList = [audience].flat().filter((a) => !!a);
  const audList = [aud].flat().filter((a) => !!a);
  const shouldVerifyAudience = audienceList.length > 0 && audList.length > 0;
  if (!shouldVerifyAudience) {
    return;
  }
  if (typeof aud === "string") {
    if (!audienceList.includes(aud)) {
      throw new TokenVerificationError({
        action: TokenVerificationErrorAction.EnsureClerkJWT,
        reason: TokenVerificationErrorReason.TokenVerificationFailed,
        message: `Invalid JWT audience claim (aud) ${JSON.stringify(aud)}. Is not included in "${JSON.stringify(
          audienceList
        )}".`
      });
    }
  } else if (isArrayString(aud)) {
    if (!aud.some((a) => audienceList.includes(a))) {
      throw new TokenVerificationError({
        action: TokenVerificationErrorAction.EnsureClerkJWT,
        reason: TokenVerificationErrorReason.TokenVerificationFailed,
        message: `Invalid JWT audience claim array (aud) ${JSON.stringify(aud)}. Is not included in "${JSON.stringify(
          audienceList
        )}".`
      });
    }
  }
};
var assertHeaderType = (typ, allowedTypes) => {
  if (typeof typ === "undefined" && typeof allowedTypes === "undefined") {
    return;
  }
  const expectedTypes = allowedTypes ?? "JWT";
  const allowed = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
  if (!allowed.includes(typ)) {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenInvalid,
      message: `Invalid JWT type ${JSON.stringify(typ)}. Expected "${allowed.join(", ")}".`
    });
  }
};
var assertHeaderAlgorithm = (alg) => {
  if (!algs.includes(alg)) {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenInvalidAlgorithm,
      message: `Invalid JWT algorithm ${JSON.stringify(alg)}. Supported: ${algs}.`
    });
  }
};
var assertSubClaim = (sub) => {
  if (typeof sub !== "string") {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Subject claim (sub) is required and must be a string. Received ${JSON.stringify(sub)}.`
    });
  }
};
var assertAuthorizedPartiesClaim = (azp, authorizedParties) => {
  if (!authorizedParties || authorizedParties.length === 0) {
    return;
  }
  if (!azp || !authorizedParties.includes(azp)) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalidAuthorizedParties,
      message: `Invalid JWT Authorized party claim (azp) ${JSON.stringify(azp)}. Expected "${authorizedParties}".`
    });
  }
};
var assertExpirationClaim = (exp, clockSkewInMs) => {
  if (typeof exp !== "number") {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Invalid JWT expiry date claim (exp) ${JSON.stringify(exp)}. Expected number.`
    });
  }
  const currentDate = new Date(Date.now());
  const expiryDate = /* @__PURE__ */ new Date(0);
  expiryDate.setUTCSeconds(exp);
  const expired = expiryDate.getTime() <= currentDate.getTime() - clockSkewInMs;
  if (expired) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenExpired,
      message: `JWT is expired. Expiry date: ${expiryDate.toUTCString()}, Current date: ${currentDate.toUTCString()}.`
    });
  }
};
var assertActivationClaim = (nbf, clockSkewInMs) => {
  if (typeof nbf === "undefined") {
    return;
  }
  if (typeof nbf !== "number") {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Invalid JWT not before date claim (nbf) ${JSON.stringify(nbf)}. Expected number.`
    });
  }
  const currentDate = new Date(Date.now());
  const notBeforeDate = /* @__PURE__ */ new Date(0);
  notBeforeDate.setUTCSeconds(nbf);
  const early = notBeforeDate.getTime() > currentDate.getTime() + clockSkewInMs;
  if (early) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenNotActiveYet,
      message: `JWT cannot be used prior to not before date claim (nbf). Not before date: ${notBeforeDate.toUTCString()}; Current date: ${currentDate.toUTCString()};`
    });
  }
};
var assertIssuedAtClaim = (iat, clockSkewInMs) => {
  if (typeof iat === "undefined") {
    return;
  }
  if (typeof iat !== "number") {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.EnsureClerkJWT,
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Invalid JWT issued at date claim (iat) ${JSON.stringify(iat)}. Expected number.`
    });
  }
  const currentDate = new Date(Date.now());
  const issuedAtDate = /* @__PURE__ */ new Date(0);
  issuedAtDate.setUTCSeconds(iat);
  const postIssued = issuedAtDate.getTime() > currentDate.getTime() + clockSkewInMs;
  if (postIssued) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenIatInTheFuture,
      message: `JWT issued at date claim (iat) is in the future. Issued at date: ${issuedAtDate.toUTCString()}; Current date: ${currentDate.toUTCString()};`
    });
  }
};
function pemToBuffer(secret) {
  const trimmed = secret.replace(/-----BEGIN.*?-----/g, "").replace(/-----END.*?-----/g, "").replace(/\s/g, "");
  const decoded = isomorphicAtob(trimmed);
  const buffer = new ArrayBuffer(decoded.length);
  const bufView = new Uint8Array(buffer);
  for (let i = 0, strLen = decoded.length; i < strLen; i++) {
    bufView[i] = decoded.charCodeAt(i);
  }
  return bufView;
}
function importKey(key, algorithm, keyUsage) {
  if (typeof key === "object") {
    return runtime.crypto.subtle.importKey("jwk", key, algorithm, false, [keyUsage]);
  }
  const keyData = pemToBuffer(key);
  const format = keyUsage === "sign" ? "pkcs8" : "spki";
  return runtime.crypto.subtle.importKey(format, keyData, algorithm, false, [keyUsage]);
}
var DEFAULT_CLOCK_SKEW_IN_MS = 5 * 1e3;
async function hasValidSignature(jwt, key) {
  const { header, signature, raw } = jwt;
  const encoder = new TextEncoder();
  const data = encoder.encode([raw.header, raw.payload].join("."));
  const algorithm = getCryptoAlgorithm(header.alg);
  try {
    const cryptoKey = await importKey(key, algorithm, "verify");
    const verified = await runtime.crypto.subtle.verify(
      algorithm.name,
      cryptoKey,
      signature,
      data
    );
    return { data: verified };
  } catch (error) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalidSignature,
          message: error?.message
        })
      ]
    };
  }
}
function decodeJwt(token) {
  const tokenParts = (token || "").toString().split(".");
  if (tokenParts.length !== 3) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: `Invalid JWT form. A JWT consists of three parts separated by dots.`
        })
      ]
    };
  }
  const [rawHeader, rawPayload, rawSignature] = tokenParts;
  const decoder = new TextDecoder();
  let header, payload, signature;
  try {
    header = JSON.parse(decoder.decode(base64url.parse(rawHeader, { loose: true })));
    payload = JSON.parse(decoder.decode(base64url.parse(rawPayload, { loose: true })));
    signature = base64url.parse(rawSignature, { loose: true });
  } catch {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: `Invalid JWT form. The header, payload, or signature could not be decoded.`
        })
      ]
    };
  }
  const data = {
    header,
    payload,
    signature,
    raw: {
      header: rawHeader,
      payload: rawPayload,
      signature: rawSignature,
      text: token
    }
  };
  return { data };
}
async function verifyJwt(token, options) {
  const { audience, authorizedParties, clockSkewInMs, key, headerType } = options;
  const clockSkew = typeof clockSkewInMs === "number" && Number.isFinite(clockSkewInMs) ? clockSkewInMs : DEFAULT_CLOCK_SKEW_IN_MS;
  const { data: decoded, errors } = decodeJwt(token);
  if (errors) {
    return { errors };
  }
  const { header, payload } = decoded;
  try {
    const { typ, alg } = header;
    assertHeaderType(typ, headerType);
    assertHeaderAlgorithm(alg);
  } catch (err) {
    return { errors: [err] };
  }
  const { data: signatureValid, errors: signatureErrors } = await hasValidSignature(decoded, key);
  if (signatureErrors) {
    return {
      errors: [
        new TokenVerificationError({
          action: TokenVerificationErrorAction.EnsureClerkJWT,
          reason: TokenVerificationErrorReason.TokenVerificationFailed,
          message: `Error verifying JWT signature. ${signatureErrors[0]}`
        })
      ]
    };
  }
  if (!signatureValid) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalidSignature,
          message: "JWT signature is invalid."
        })
      ]
    };
  }
  try {
    const { azp, sub, aud, iat, exp, nbf } = payload;
    assertSubClaim(sub);
    assertAudienceClaim(aud, audience);
    assertAuthorizedPartiesClaim(azp, authorizedParties);
    assertExpirationClaim(exp, clockSkew);
    assertActivationClaim(nbf, clockSkew);
    assertIssuedAtClaim(iat, clockSkew);
  } catch (err) {
    return { errors: [err] };
  }
  return { data: payload };
}

// node_modules/@clerk/backend/dist/chunk-TOROEX6P.mjs
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/underscore.mjs
function snakeToCamel(str) {
  return str ? str.replace(/([-_][a-z])/g, (match2) => match2.toUpperCase().replace(/-|_/, "")) : "";
}
function camelToSnake(str) {
  return str ? str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`) : "";
}
var createDeepObjectTransformer = (transform) => {
  const deepTransform = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map((el) => {
      if (typeof el === "object" || Array.isArray(el)) return deepTransform(el);
      return el;
    });
    const copy = { ...obj };
    const keys = Object.keys(copy);
    for (const oldName of keys) {
      const newName = transform(oldName.toString());
      if (newName !== oldName) {
        copy[newName] = copy[oldName];
        delete copy[oldName];
      }
      if (typeof copy[newName] === "object") copy[newName] = deepTransform(copy[newName]);
    }
    return copy;
  };
  return deepTransform;
};
var deepCamelToSnake = createDeepObjectTransformer(camelToSnake);
var deepSnakeToCamel = createDeepObjectTransformer(snakeToCamel);

// node_modules/@clerk/backend/dist/chunk-JYRQONPS.mjs
var require_dist = __commonJS({
  "../../node_modules/.pnpm/cookie@1.1.1/node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});
var API_URL = "https://api.clerk.com";
var API_VERSION = "v1";
var USER_AGENT = `${"@clerk/backend"}@${"3.23.2"}`;
var MAX_CACHE_LAST_UPDATED_AT_SECONDS = 5 * 60;
var SUPPORTED_BAPI_VERSION = "2026-05-12";
var Cookies = {
  Session: "__session",
  Refresh: "__refresh",
  ClientUat: "__client_uat",
  Handshake: "__clerk_handshake",
  DevBrowser: "__clerk_db_jwt",
  RedirectCount: "__clerk_redirect_count",
  HandshakeNonce: "__clerk_handshake_nonce"
};
var QueryParameters = {
  ClerkSynced: "__clerk_synced",
  SuffixedCookies: "suffixed_cookies",
  ClerkRedirectUrl: "__clerk_redirect_url",
  // use the reference to Cookies to indicate that it's the same value
  DevBrowser: Cookies.DevBrowser,
  Handshake: Cookies.Handshake,
  HandshakeHelp: "__clerk_help",
  LegacyDevBrowser: "__dev_session",
  HandshakeReason: "__clerk_hs_reason",
  HandshakeNonce: Cookies.HandshakeNonce,
  HandshakeFormat: "format",
  Session: "__session"
};
var TokenType = {
  SessionToken: "session_token",
  ApiKey: "api_key",
  M2MToken: "m2m_token",
  OAuthToken: "oauth_token"
};
var SEPARATOR = "/";
var MULTIPLE_SEPARATOR_REGEX = new RegExp("(?<!:)" + SEPARATOR + "{1,}", "g");
var MAX_DECODES = 10;
function isDotSegment(segment) {
  let candidate = segment;
  for (let i = 0; i <= MAX_DECODES; i++) {
    if (candidate.split(/[/\\]/).some((p) => p === "." || p === "..")) {
      return true;
    }
    if (i === MAX_DECODES) {
      throw new Error(`joinPaths: too many layers of encoding in ${segment}`);
    }
    try {
      const next = decodeURIComponent(candidate);
      if (next === candidate) {
        break;
      }
      candidate = next;
    } catch {
      break;
    }
  }
  return false;
}
function joinPaths(...args) {
  const result = args.filter((p) => p).join(SEPARATOR).replace(MULTIPLE_SEPARATOR_REGEX, SEPARATOR);
  for (const segment of result.split(SEPARATOR)) {
    if (isDotSegment(segment)) {
      throw new Error(`joinPaths: "." and ".." path segments are not allowed (received "${result}")`);
    }
  }
  return result;
}
var M2M_RESERVED_JWT_CLAIMS = /* @__PURE__ */ new Set(["iss", "sub", "exp", "nbf", "iat", "jti"]);
function extractCustomClaims(payload) {
  const claims = {};
  for (const key of Object.keys(payload)) {
    if (!M2M_RESERVED_JWT_CLAIMS.has(key)) {
      claims[key] = payload[key];
    }
  }
  return Object.keys(claims).length > 0 ? claims : null;
}
var M2MToken = class _M2MToken {
  constructor(id, subject, scopes, claims, revoked, revocationReason, expired, expiration, createdAt, updatedAt, token) {
    this.id = id;
    this.subject = subject;
    this.scopes = scopes;
    this.claims = claims;
    this.revoked = revoked;
    this.revocationReason = revocationReason;
    this.expired = expired;
    this.expiration = expiration;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.token = token;
  }
  static fromJSON(data) {
    return new _M2MToken(
      data.id,
      data.subject,
      data.scopes,
      data.claims,
      data.revoked,
      data.revocation_reason,
      data.expired,
      data.expiration,
      data.created_at,
      data.updated_at,
      data.token
    );
  }
  static fromJwtPayload(payload, clockSkewInMs = 5e3) {
    return new _M2MToken(
      payload.jti ?? "",
      // jti should always be present in Clerk-issued M2M JWTs
      payload.sub,
      payload.scopes?.split(" ") ?? payload.aud ?? [],
      extractCustomClaims(payload),
      false,
      null,
      payload.exp * 1e3 <= Date.now() - clockSkewInMs,
      payload.exp * 1e3,
      // milliseconds — expiration, converted from JWT exp claim
      payload.iat * 1e3,
      // milliseconds — createdAt, converted from JWT iat claim
      payload.iat * 1e3
      // milliseconds — updatedAt, no JWT equivalent; defaults to iat
    );
  }
};
var JWT_CATEGORY_M2M_TOKEN = "cl_B7d4PD333AAA";
var remoteCaches = /* @__PURE__ */ new Map();
function getRemoteCache(scope) {
  let cache = remoteCaches.get(scope);
  if (!cache) {
    for (const [key, entry] of remoteCaches) {
      if (cacheHasExpired(entry)) {
        remoteCaches.delete(key);
      }
    }
    cache = { keys: {}, lastUpdatedAt: 0 };
    remoteCaches.set(scope, cache);
  }
  return cache;
}
var PEM_HEADER = "-----BEGIN PUBLIC KEY-----";
var PEM_TRAILER = "-----END PUBLIC KEY-----";
var RSA_PREFIX = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA";
var RSA_SUFFIX = "IDAQAB";
function loadClerkJwkFromPem(params) {
  const { kid, pem } = params;
  if (!pem) {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.SetClerkJWTKey,
      message: "Missing local JWK.",
      reason: TokenVerificationErrorReason.LocalJWKMissing
    });
  }
  const modulus = pem.replace(/\r\n|\n|\r/g, "").replace(PEM_HEADER, "").replace(PEM_TRAILER, "").replace(RSA_PREFIX, "").replace(RSA_SUFFIX, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwk = { kid: `local-${kid}`, kty: "RSA", alg: "RS256", n: modulus, e: "AQAB" };
  return jwk;
}
async function loadClerkJWKFromRemote(params) {
  const { secretKey, apiUrl = API_URL, apiVersion = API_VERSION, kid, skipJwksCache } = params;
  const cache = getRemoteCache(`${apiUrl}|${apiVersion}|${secretKey ?? ""}`);
  if (skipJwksCache || cacheHasExpired(cache) || !cache.keys[kid]) {
    if (!secretKey) {
      throw new TokenVerificationError({
        action: TokenVerificationErrorAction.ContactSupport,
        message: "Failed to load JWKS from Clerk Backend or Frontend API.",
        reason: TokenVerificationErrorReason.RemoteJWKFailedToLoad
      });
    }
    const fetcher = () => fetchJWKSFromBAPI(apiUrl, secretKey, apiVersion);
    const { keys } = await retry(fetcher);
    if (!keys || !keys.length) {
      throw new TokenVerificationError({
        action: TokenVerificationErrorAction.ContactSupport,
        message: "The JWKS endpoint did not contain any signing keys. Contact support@clerk.com.",
        reason: TokenVerificationErrorReason.RemoteJWKFailedToLoad
      });
    }
    keys.forEach((key) => {
      cache.keys[key.kid] = key;
    });
    cache.lastUpdatedAt = Date.now();
  }
  const jwk = cache.keys[kid];
  if (!jwk) {
    throw new TokenVerificationError({
      action: `Go to your Dashboard and validate your secret and public keys are correct. ${TokenVerificationErrorAction.ContactSupport} if the issue persists.`,
      message: `Unable to find a signing key in JWKS that matches the kid='${kid}' of the provided session token. Please make sure that the __session cookie or the HTTP authorization header contain a Clerk-generated session JWT.`,
      reason: TokenVerificationErrorReason.JWKKidMismatch
    });
  }
  return jwk;
}
async function fetchJWKSFromBAPI(apiUrl, key, apiVersion) {
  if (!key) {
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.SetClerkSecretKey,
      message: "Missing Clerk Secret Key or API Key. Go to https://dashboard.clerk.com and get your key for your instance.",
      reason: TokenVerificationErrorReason.RemoteJWKFailedToLoad
    });
  }
  const url = new URL(apiUrl);
  url.pathname = joinPaths(url.pathname, apiVersion, "/jwks");
  const response = await runtime.fetch(url.href, {
    headers: {
      Authorization: `Bearer ${key}`,
      "Clerk-API-Version": SUPPORTED_BAPI_VERSION,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT
    }
  });
  if (!response.ok) {
    const json = await response.json();
    const invalidSecretKeyError = getErrorObjectByCode(json?.errors, TokenVerificationErrorCode.InvalidSecretKey);
    if (invalidSecretKeyError) {
      const reason = TokenVerificationErrorReason.InvalidSecretKey;
      throw new TokenVerificationError({
        action: TokenVerificationErrorAction.ContactSupport,
        message: invalidSecretKeyError.message,
        reason
      });
    }
    throw new TokenVerificationError({
      action: TokenVerificationErrorAction.ContactSupport,
      message: `Error loading Clerk JWKS from ${url.href} with code=${response.status}`,
      reason: TokenVerificationErrorReason.RemoteJWKFailedToLoad
    });
  }
  return response.json();
}
function cacheHasExpired(cache) {
  const isExpired = Date.now() - cache.lastUpdatedAt >= MAX_CACHE_LAST_UPDATED_AT_SECONDS * 1e3;
  if (isExpired) {
    cache.keys = {};
  }
  return isExpired;
}
var getErrorObjectByCode = (errors, code) => {
  if (!errors) {
    return null;
  }
  return errors.find((err) => err.code === code);
};
var MACHINE_TOKEN_TYPES = /* @__PURE__ */ new Set([TokenType.ApiKey, TokenType.M2MToken, TokenType.OAuthToken]);
async function resolveKeyAndVerifyJwt(token, kid, options, headerType) {
  try {
    let key;
    if (options.jwtKey) {
      key = loadClerkJwkFromPem({ kid, pem: options.jwtKey });
    } else if (options.secretKey) {
      key = await loadClerkJWKFromRemote({ ...options, kid });
    } else {
      return {
        error: new MachineTokenVerificationError({
          action: TokenVerificationErrorAction.SetClerkJWTKey,
          message: "Failed to resolve JWK during verification.",
          code: MachineTokenVerificationErrorCode.TokenVerificationFailed
        })
      };
    }
    const { data: payload, errors: verifyErrors } = await verifyJwt(token, {
      ...options,
      key,
      ...headerType ? { headerType } : {}
    });
    if (verifyErrors) {
      return {
        error: new MachineTokenVerificationError({
          code: MachineTokenVerificationErrorCode.TokenVerificationFailed,
          message: verifyErrors[0].message
        })
      };
    }
    return { payload };
  } catch (error) {
    return {
      error: new MachineTokenVerificationError({
        code: MachineTokenVerificationErrorCode.TokenVerificationFailed,
        message: error.message
      })
    };
  }
}
async function verifyM2MJwt(token, decoded, options) {
  const cat = decoded.header.cat;
  if (cat !== void 0 && cat !== JWT_CATEGORY_M2M_TOKEN) {
    return {
      data: void 0,
      tokenType: TokenType.M2MToken,
      errors: [
        new MachineTokenVerificationError({
          code: MachineTokenVerificationErrorCode.TokenInvalid,
          message: "Invalid M2M JWT category."
        })
      ]
    };
  }
  const result = await resolveKeyAndVerifyJwt(token, decoded.header.kid, options);
  if ("error" in result) {
    return { data: void 0, tokenType: TokenType.M2MToken, errors: [result.error] };
  }
  return {
    data: M2MToken.fromJwtPayload(result.payload, options.clockSkewInMs),
    tokenType: TokenType.M2MToken,
    errors: void 0
  };
}
var _verifyOptions;
var _M2MTokenApi_instances;
var createRequestOptions_fn;
var verifyJwtFormat_fn;
_verifyOptions = /* @__PURE__ */ new WeakMap();
_M2MTokenApi_instances = /* @__PURE__ */ new WeakSet();
createRequestOptions_fn = function(options, machineSecretKey) {
  if (machineSecretKey) {
    return {
      ...options,
      headerParams: {
        ...options.headerParams,
        Authorization: `Bearer ${machineSecretKey}`
      }
    };
  }
  return options;
};
verifyJwtFormat_fn = async function(token) {
  let decoded;
  try {
    const { data, errors } = decodeJwt(token);
    if (errors) {
      throw errors[0];
    }
    decoded = data;
  } catch (e) {
    throw new MachineTokenVerificationError({
      code: MachineTokenVerificationErrorCode.TokenInvalid,
      message: e.message
    });
  }
  const result = await verifyM2MJwt(token, decoded, __privateGet(this, _verifyOptions));
  if (result.errors) {
    throw result.errors[0];
  }
  return result.data;
};
var PlainObjectConstructor = {}.constructor;
var import_cookie = __toESM(require_dist());
async function verifyToken(token, options) {
  const { data: decodedResult, errors } = decodeJwt(token);
  if (errors) {
    return { errors };
  }
  const { header } = decodedResult;
  const { kid } = header;
  if (header.cat === JWT_CATEGORY_M2M_TOKEN) {
    return {
      errors: [
        new TokenVerificationError({
          action: TokenVerificationErrorAction.EnsureClerkJWT,
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: "Invalid session token category."
        })
      ]
    };
  }
  try {
    let key;
    if (options.jwtKey) {
      key = loadClerkJwkFromPem({ kid, pem: options.jwtKey });
    } else if (options.secretKey) {
      key = await loadClerkJWKFromRemote({ ...options, kid });
    } else {
      return {
        errors: [
          new TokenVerificationError({
            action: TokenVerificationErrorAction.SetClerkJWTKey,
            message: "Failed to resolve JWK during verification.",
            reason: TokenVerificationErrorReason.JWKFailedToResolve
          })
        ]
      };
    }
    return await verifyJwt(token, { ...options, key });
  } catch (error) {
    return { errors: [error] };
  }
}

// node_modules/@clerk/backend/dist/chunk-P263NW7Z.mjs
function withLegacyReturn(cb) {
  return async (...args) => {
    const { data, errors } = await cb(...args);
    if (errors) {
      throw errors[0];
    }
    return data;
  };
}

// node_modules/@clerk/backend/node_modules/@clerk/shared/dist/_chunks/telemetry-9C6N5ppw.mjs
var PROCESS_FLAG = Symbol.for("@clerk/shared.telemetryNoticeShown");

// node_modules/@clerk/backend/dist/index.mjs
var verifyToken2 = withLegacyReturn(verifyToken);

// src/data/booksData.ts
var BOOKS_DATA = [
  // 1. Top Books of All Time (Post-1950)
  {
    id: "book-classics-1",
    title: "One Hundred Years of Solitude",
    author: "Gabriel Garc\xEDa M\xE1rquez",
    year: 1967,
    rating: 4.88,
    reviewCount: 3820,
    pages: 432,
    genre: "Top Classics",
    secondaryGenre: "Magical Realism",
    synopsis: "The multi-generational saga of the Buend\xEDa family in the mythic town of Macondo, weaving miraculous visions with Colombia\u2019s tumultuous political history.",
    quote: "Many years later, as he faced the firing squad, Colonel Aureliano Buend\xEDa was to remember that distant afternoon when his father took him to discover ice.",
    whyYouWillLoveIt: "A monumental milestone of 20th-century literature. M\xE1rquez paints an unforgettable universe where ghosts, yellow butterflies, and time itself fold in eternal recurrence.",
    moodTags: ["Melancholic & Luminous", "Quiet Contemplation", "Otherworldly Wonder"],
    coverGradient: "from-[#3a4454] via-[#2a3240] to-[#1c222b]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-classics-1.jpg",
    isbn: "9789588774060"
  },
  {
    id: "book-classics-2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    rating: 4.92,
    reviewCount: 5410,
    pages: 320,
    genre: "Top Classics",
    secondaryGenre: "Southern Gothic",
    synopsis: "Set in Depression-era Maycomb, Alabama, lawyer Atticus Finch defends Tom Robinson, a Black man falsely accused of rape, through the tender eyes of his young daughter Scout.",
    quote: "You never really understand a person until you consider things from his point of view... until you climb into his skin and walk around in it.",
    whyYouWillLoveIt: "An enduring moral compass of American literature exploring childhood innocence, racial injustice, and courageous integrity.",
    moodTags: ["Quiet Contemplation", "Bittersweet Resonance"],
    coverGradient: "from-[#705a4f] via-[#4a3b32] to-[#2b211a]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-classics-2.jpg",
    isbn: "0061743534"
  },
  {
    id: "book-classics-3",
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    year: 1958,
    rating: 4.81,
    reviewCount: 2950,
    pages: 192,
    genre: "Top Classics",
    secondaryGenre: "African Literature",
    synopsis: "The story of Okonkwo, a proud Igbo warrior and leader in Umuofia, whose traditional world violently collides with British colonialism and Christian missionaries.",
    quote: "The white man is very clever. He came quietly and peaceably with his religion. We were amused at his foolishness and allowed him to stay.",
    whyYouWillLoveIt: "A masterpiece of African fiction that reclaimed cultural history and illuminated the tragedy of ancestral traditions fractured by imperial conquest.",
    moodTags: ["Intellectual Labyrinth", "Historical Depth"],
    coverGradient: "from-[#5d4037] via-[#3e2723] to-[#201410]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-classics-3.jpg",
    isbn: "0385474547"
  },
  // 2. Best Fiction Books
  {
    id: "book-fiction-1",
    title: "Beloved",
    author: "Toni Morrison",
    year: 1987,
    rating: 4.9,
    reviewCount: 4210,
    pages: 321,
    genre: "Best Fiction",
    secondaryGenre: "Historical Fiction",
    synopsis: "Sethe, an escaped enslaved woman living in post-Civil War Ohio, is haunted by the physical embodiment of the baby daughter she killed to save from a life in chains.",
    quote: "Freeing yourself was one thing, claiming ownership of that freed self was another.",
    whyYouWillLoveIt: "Morrison\u2019s prose is incandescent and incisive, transforming historical trauma into a mythic, unforgettable meditation on maternal love and memory.",
    moodTags: ["Melancholic & Luminous", "Poetic & Introspective"],
    coverGradient: "from-[#2b253b] via-[#1f192b] to-[#120e1c]",
    coverTextColor: "#eedefc",
    coverImage: "/covers/book-fiction-1.jpg",
    isbn: "9780099511656"
  },
  {
    id: "book-fiction-2",
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    year: 1954,
    rating: 4.96,
    reviewCount: 8940,
    pages: 492,
    genre: "Best Fiction",
    secondaryGenre: "High Fantasy",
    synopsis: "Frodo Baggins embarks on a perilous quest across Middle-earth to cast the One Ring into the fires of Mount Doom and overthrow the Dark Lord Sauron.",
    quote: "All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.",
    whyYouWillLoveIt: "The absolute pinnacle of world-building and mythopoeia, exploring fellowship, noble sacrifice, and the enduring triumph of the meek against absolute shadow.",
    moodTags: ["Otherworldly Wonder", "Electric Adrenaline"],
    coverGradient: "from-[#2e3b32] via-[#202923] to-[#141a16]",
    coverTextColor: "#e8f0eb",
    coverImage: "/covers/book-fiction-2.jpg",
    isbn: "9781500410223"
  },
  {
    id: "book-fiction-3",
    title: "Midnight's Children",
    author: "Salman Rushdie",
    year: 1981,
    rating: 4.84,
    reviewCount: 3120,
    pages: 580,
    genre: "Best Fiction",
    secondaryGenre: "Magical Realism",
    synopsis: "Saleem Sinai is born at the exact midnight stroke of India\u2019s independence, gifted with telepathy connecting him to 1,000 children born in that fateful hour.",
    quote: "I was born in the city of Bombay... once upon a time. No, that won\u2019t do, there\u2019s no getting away from the date: I was born at the stroke of midnight.",
    whyYouWillLoveIt: "A dazzling linguistic tapestry blending myth, political fury, and exuberant storytelling that won the Booker of Bookers.",
    moodTags: ["Intellectual Labyrinth", "Vibrant Cadence"],
    coverGradient: "from-[#5c6e58] via-[#3a4a36] to-[#222e20]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-fiction-3.jpg",
    isbn: "9781283999816"
  },
  // 3. Self-Help & Personal Growth
  {
    id: "book-selfhelp-1",
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    rating: 4.93,
    reviewCount: 7850,
    pages: 323,
    genre: "Self-Help",
    secondaryGenre: "Habit Formation",
    synopsis: "A transformative framework for improving 1% every day, explaining how tiny micro-behaviors compound geometrically into life-altering achievements.",
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    whyYouWillLoveIt: "Clear dismantles vague motivation and replaces it with practical, neurological cues and identity-based habit loops that stick.",
    moodTags: ["Quiet Contemplation", "Pragmatic Clarity"],
    coverGradient: "from-[#8c5e43] via-[#6d4630] to-[#4e2f1d]",
    coverTextColor: "#fdfbf7",
    coverImage: "/covers/book-selfhelp-1.jpg",
    isbn: "9798545118748"
  },
  {
    id: "book-selfhelp-2",
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    year: 1989,
    rating: 4.86,
    reviewCount: 5210,
    pages: 374,
    genre: "Self-Help",
    secondaryGenre: "Personal Leadership",
    synopsis: "A holistic character-ethic model centered on proactivity, beginning with the end in mind, empathetic listening, and continuous physical-mental renewal.",
    quote: "Most people do not listen with the intent to understand; they listen with the intent to reply.",
    whyYouWillLoveIt: "A generational classic that shifts your worldview from quick personality tricks to foundational integrity and deep human synergy.",
    moodTags: ["Intellectual Labyrinth", "Character Ethics"],
    coverGradient: "from-[#455a64] via-[#263238] to-[#161d20]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-selfhelp-2.jpg",
    isbn: "9780743269513"
  },
  {
    id: "book-selfhelp-3",
    title: "The Courage to Be Disliked",
    author: "Ichiro Kishimi & Fumitake Koga",
    year: 2013,
    rating: 4.85,
    reviewCount: 3940,
    pages: 280,
    genre: "Self-Help",
    secondaryGenre: "Adlerian Psychology",
    synopsis: "A dialogue between a youth and a philosopher in suburban Tokyo, exploring Alfred Adler\u2019s psychology on separation of tasks and interpersonal liberation.",
    quote: "The courage to be happy also includes the courage to be disliked.",
    whyYouWillLoveIt: "Radically liberates you from the exhausting urge to seek others\u2019 recognition, presenting true happiness through present-moment contribution.",
    moodTags: ["Quiet Contemplation", "Philosophical Solace"],
    coverGradient: "from-[#3a4454] via-[#222b37] to-[#151c24]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-selfhelp-3.jpg",
    isbn: "9786180123975"
  },
  // 4. Business Management & Leadership
  {
    id: "book-business-1",
    title: "Good to Great",
    author: "Jim Collins",
    year: 2001,
    rating: 4.87,
    reviewCount: 4180,
    pages: 300,
    genre: "Business & Leadership",
    secondaryGenre: "Management Strategy",
    synopsis: "Jim Collins and his research team decode the principles that propelled ordinary companies into exceptional market giants that sustained high returns for decades.",
    quote: "Greatness is not a function of circumstance. Greatness, it turns out, is largely a matter of conscious choice, and discipline.",
    whyYouWillLoveIt: "Famous for Level 5 Leadership, the Hedgehog Concept, and the Flywheel effect\u2014a rigorously data-backed masterclass on endurance.",
    moodTags: ["Pragmatic Clarity", "Strategic Mastery"],
    coverGradient: "from-[#4a3b32] via-[#322620] to-[#1c1410]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-business-1.jpg",
    isbn: "0712676090"
  },
  {
    id: "book-business-2",
    title: "Start with Why",
    author: "Simon Sinek",
    year: 2009,
    rating: 4.83,
    reviewCount: 3890,
    pages: 246,
    genre: "Business & Leadership",
    secondaryGenre: "Inspirational Leadership",
    synopsis: "Simon Sinek explores the Golden Circle framework: why inspiring organizations start by articulating core purpose rather than what they sell.",
    quote: "People don\u2019t buy what you do; they buy why you do it.",
    whyYouWillLoveIt: "A visionary guide on organizational inspiration, showing how authentic belief rallies teams and builds unbreakable customer loyalty.",
    moodTags: ["Inspirational Vision", "Core Purpose"],
    coverGradient: "from-[#2d3748] via-[#1a202c] to-[#11141a]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-business-2.jpg",
    isbn: "9780241958230"
  },
  {
    id: "book-business-3",
    title: "Influence: The Psychology of Persuasion",
    author: "Robert B. Cialdini",
    year: 1984,
    rating: 4.91,
    reviewCount: 4620,
    pages: 287,
    genre: "Business & Leadership",
    secondaryGenre: "Behavioral Economics",
    synopsis: "The seminal examination of the psychological levers that drive compliance: reciprocation, commitment, social proof, authority, liking, and scarcity.",
    quote: "We all fool ourselves from time to time in order to keep our thoughts and beliefs consistent with what we have already done or decided.",
    whyYouWillLoveIt: "Essential reading for any communicator, negotiator, or reader who wants to understand how the subconscious mind says yes.",
    moodTags: ["Intellectual Labyrinth", "Behavioral Insight"],
    coverGradient: "from-[#705a4f] via-[#524036] to-[#30241d]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-business-3.jpg",
    isbn: "9781624608049"
  },
  // 5. Startups & Entrepreneurship
  {
    id: "book-startup-1",
    title: "The Lean Startup",
    author: "Eric Ries",
    year: 2011,
    rating: 4.82,
    reviewCount: 3950,
    pages: 336,
    genre: "Startups & Entrepreneurship",
    secondaryGenre: "Agile Innovation",
    synopsis: "Introduced the Build-Measure-Learn cycle and Minimum Viable Product (MVP), teaching founders how to steer and pivot under extreme uncertainty.",
    quote: "The only way to win is to learn faster than anyone else.",
    whyYouWillLoveIt: "Transformed modern software engineering and venture creation by treating hypotheses as experiments rather than fixed business plans.",
    moodTags: ["Agile Velocity", "Experimental Thinking"],
    coverGradient: "from-[#3a4454] via-[#242b36] to-[#151920]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-startup-1.jpg",
    isbn: "9783868815672"
  },
  {
    id: "book-startup-2",
    title: "Zero to One",
    author: "Peter Thiel",
    year: 2014,
    rating: 4.89,
    reviewCount: 4890,
    pages: 253,
    genre: "Startups & Entrepreneurship",
    secondaryGenre: "Venture Building",
    synopsis: "Peter Thiel argues that genuine progress comes from creating vertical breakthroughs (0 to 1) rather than iterating on existing competition (1 to n).",
    quote: "The best entrepreneurs know this: every great business is built around a secret that\u2019s hidden from the outside.",
    whyYouWillLoveIt: "Sharp, contrarian philosophy on monopoly creation, proprietary secrets, and building companies that invent the future.",
    moodTags: ["Contrarian Insight", "Deep Strategy"],
    coverGradient: "from-[#202923] via-[#151d18] to-[#0c120e]",
    coverTextColor: "#e8f0eb",
    coverImage: "/covers/book-startup-2.jpg",
    isbn: "9780753555194"
  },
  {
    id: "book-startup-3",
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    year: 2014,
    rating: 4.88,
    reviewCount: 3740,
    pages: 304,
    genre: "Startups & Entrepreneurship",
    secondaryGenre: "Executive Management",
    synopsis: "Unfiltered, raw stories from Andreessen Horowitz co-founder Ben Horowitz on surviving company crises, firing executives, and leading through the struggle.",
    quote: "There are no silver bullets, only lead bullets. Hard things are hard because there are no easy answers or recipes.",
    whyYouWillLoveIt: "Dispenses with startup romanticism and offers compassionate, tactical survival wisdom for when everything is going wrong.",
    moodTags: ["Electric Adrenaline", "Executive Grit"],
    coverGradient: "from-[#5d4037] via-[#3d2720] to-[#241510]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-startup-3.jpg",
    isbn: "1483002896"
  },
  // 6. Money, Investing & Stock Market
  {
    id: "book-money-1",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: 2020,
    rating: 4.95,
    reviewCount: 6820,
    pages: 288,
    genre: "Money & Investing",
    secondaryGenre: "Behavioral Finance",
    synopsis: "Nineteen short stories showing how personal financial success has far less to do with intelligence and equations than with behavior, patience, and ego.",
    quote: "Doing well with money has a little to do with how smart you are and a lot to do with how you behave.",
    whyYouWillLoveIt: "Brilliantly accessible and wise, reframing wealth as freedom, peace of mind, and the luxury of sleeping well at night.",
    moodTags: ["Quiet Contemplation", "Pragmatic Wisdom"],
    coverGradient: "from-[#5c6e58] via-[#3a4a36] to-[#1f281d]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-money-1.jpg",
    isbn: "9786555111101"
  },
  {
    id: "book-money-2",
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    year: 1973,
    rating: 4.83,
    reviewCount: 3120,
    pages: 440,
    genre: "Money & Investing",
    secondaryGenre: "Index Investing",
    synopsis: "The Princeton professor\u2019s benchmark guide to investment theory, establishing the Efficient Market Hypothesis and debunking active trading myths.",
    quote: "A blindfolded chimpanzee throwing darts at the Wall Street Journal could select a portfolio that does just as well as the experts.",
    whyYouWillLoveIt: "Witty, rigorous, and empowering: the ultimate intellectual foundation for compound passive wealth building.",
    moodTags: ["Intellectual Labyrinth", "Historical Rigor"],
    coverGradient: "from-[#2b253b] via-[#1a1624] to-[#0f0c15]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-money-2.jpg",
    isbn: "0393057828"
  },
  {
    id: "book-money-3",
    title: "The Little Book of Common Sense Investing",
    author: "John C. Bogle",
    year: 2007,
    rating: 4.87,
    reviewCount: 3410,
    pages: 228,
    genre: "Money & Investing",
    secondaryGenre: "Passive Wealth",
    synopsis: "Vanguard founder Jack Bogle demonstrates how broad market low-cost index funds guarantee investors capture their fair share of stock market returns.",
    quote: "Don\u2019t look for the needle in the haystack. Just buy the haystack!",
    whyYouWillLoveIt: "Clear mathematical common sense that cuts through Wall Street fees and unlocks peaceful lifelong financial security.",
    moodTags: ["Minimalist Clarity", "Steadfast Logic"],
    coverGradient: "from-[#455a64] via-[#2c393f] to-[#1a2226]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-money-3.jpg",
    isbn: "0470139277"
  },
  // 7. Philosophy
  {
    id: "book-philo-1",
    title: "The Myth of Sisyphus",
    author: "Albert Camus",
    year: 1955,
    rating: 4.88,
    reviewCount: 3670,
    pages: 212,
    genre: "Philosophy",
    secondaryGenre: "Absurdism",
    synopsis: "Camus confronts the absurdity of human consciousness within a silent, indifferent cosmos, declaring that conscious revolt and passion conquer despair.",
    quote: "The struggle itself toward the heights is enough to fill a man\u2019s heart. One must imagine Sisyphus happy.",
    whyYouWillLoveIt: "An electrifying philosophical essay that rejects nihilism and finds supreme joy and freedom in living without appeal.",
    moodTags: ["Melancholic & Luminous", "Quiet Contemplation"],
    coverGradient: "from-[#4a3933] via-[#352722] to-[#201613]",
    coverTextColor: "#f5ebe6",
    coverImage: "/covers/book-philo-1.jpg",
    isbn: "9780394437606"
  },
  {
    id: "book-philo-2",
    title: "G\xF6del, Escher, Bach",
    author: "Douglas Hofstadter",
    year: 1979,
    rating: 4.93,
    reviewCount: 4890,
    pages: 777,
    genre: "Philosophy",
    secondaryGenre: "Cognitive Science",
    synopsis: "A Pulitzer Prize-winning tour de force weaving mathematical incompleteness, fugues by J.S. Bach, and M.C. Escher\u2019s recursive woodcuts into the puzzle of consciousness.",
    quote: "In the end, we self-perceiving, self-inventing, locked-in mirages are little miracles of self-reference.",
    whyYouWillLoveIt: "A labyrinth of playful dialogues and profound puzzles that expands how you think about minds, loops, and computers.",
    moodTags: ["Intellectual Labyrinth", "Otherworldly Wonder"],
    coverGradient: "from-[#2e3b32] via-[#1c241f] to-[#101512]",
    coverTextColor: "#e8f0eb",
    coverImage: "/covers/book-philo-2.jpg",
    isbn: "3423300175"
  },
  {
    id: "book-philo-3",
    title: "Simulacra and Simulation",
    author: "Jean Baudrillard",
    year: 1981,
    rating: 4.8,
    reviewCount: 2840,
    pages: 164,
    genre: "Philosophy",
    secondaryGenre: "Postmodern Theory",
    synopsis: "Baudrillard investigates how symbols, media, and digital representations have eclipsed physical reality, generating a hyperreal simulation of existence.",
    quote: "The simulacrum is never what conceals the truth\u2014it is the truth that conceals that there is none.",
    whyYouWillLoveIt: "The foundational text that inspired The Matrix and anticipated the modern spectacle of viral feeds and synthetic media.",
    moodTags: ["Intellectual Labyrinth", "Ontological Vertigo"],
    coverGradient: "from-[#2d3748] via-[#1f2633] to-[#12161e]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-philo-3.jpg",
    isbn: "0472065211"
  },
  // 8. Psychology
  {
    id: "book-psych-1",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    year: 2011,
    rating: 4.91,
    reviewCount: 6420,
    pages: 548,
    genre: "Psychology",
    secondaryGenre: "Cognitive Biases",
    synopsis: "Nobel laureate Daniel Kahneman synthesizes decades of behavioral research, exploring the instinctive System 1 and deliberative System 2 in human judgment.",
    quote: "A reliable way to make people believe in falsehoods is frequent repetition, because familiarity is not easily distinguished from truth.",
    whyYouWillLoveIt: "A landmark work that permanently changes how you perceive your own intuitive snap judgments, risk estimations, and memory biases.",
    moodTags: ["Intellectual Labyrinth", "Cognitive Discovery"],
    coverGradient: "from-[#705a4f] via-[#4d3c34] to-[#2d221c]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-psych-1.jpg",
    isbn: "9781535535830"
  },
  {
    id: "book-psych-2",
    title: "The Man Who Mistook His Wife for a Hat",
    author: "Oliver Sacks",
    year: 1985,
    rating: 4.86,
    reviewCount: 3950,
    pages: 308,
    genre: "Psychology",
    secondaryGenre: "Neuropsychology",
    synopsis: "Dr. Oliver Sacks recounts compassionate clinical portraits of patients suffering from agnosias, lost memories, and bizarre neurological alterations.",
    quote: "If a man has lost a leg or an eye, he knows he has lost a leg or an eye; but if he has lost a self\u2014himself\u2014he cannot know it, because he is no longer there to know it.",
    whyYouWillLoveIt: "Warm, lyrical, and profoundly humane: Sacks celebrates the resilient spirit of individuals navigating strange mental landscapes.",
    moodTags: ["Poetic & Introspective", "Compassionate Observation"],
    coverGradient: "from-[#3a4454] via-[#28303b] to-[#161a20]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-psych-2.jpg",
    isbn: "9780593466674"
  },
  {
    id: "book-psych-3",
    title: "Mindset: The New Psychology of Success",
    author: "Carol S. Dweck",
    year: 2006,
    rating: 4.82,
    reviewCount: 3480,
    pages: 288,
    genre: "Psychology",
    secondaryGenre: "Growth Mindset",
    synopsis: "Carol Dweck presents her research on fixed vs. growth mindsets, showing how beliefs about our intelligence determine resilience, learning, and fulfillment.",
    quote: "Becoming is better than being. The passion for stretching yourself and sticking to it, even when it\u2019s not going well, is the hallmark of the growth mindset.",
    whyYouWillLoveIt: "Empowers readers, educators, and leaders to reframe failure as fuel for mastery and continual personal evolution.",
    moodTags: ["Quiet Contemplation", "Self-Actualization"],
    coverGradient: "from-[#5d4037] via-[#422c26] to-[#261915]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-psych-3.jpg",
    isbn: "8416579164"
  },
  // 9. Biography & Memoir
  {
    id: "book-bio-1",
    title: "The Autobiography of Malcolm X",
    author: "Malcolm X & Alex Haley",
    year: 1965,
    rating: 4.94,
    reviewCount: 4980,
    pages: 462,
    genre: "Biography & Memoir",
    secondaryGenre: "Civil Rights",
    synopsis: "The unforgettable life story of Malcolm X, chronicling his street years, prison epiphany, charismatic leadership in the Nation of Islam, and pilgrimage to Mecca.",
    quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    whyYouWillLoveIt: "Electrifying in its honesty, intelligence, and courageous capacity for radical self-reinvention in pursuit of universal truth.",
    moodTags: ["Electric Adrenaline", "Courageous Transcendence"],
    coverGradient: "from-[#2b253b] via-[#1d1828] to-[#100d16]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-bio-1.jpg",
    isbn: "9780802140852"
  },
  {
    id: "book-bio-2",
    title: "Steve Jobs",
    author: "Walter Isaacson",
    year: 2011,
    rating: 4.89,
    reviewCount: 5620,
    pages: 664,
    genre: "Biography & Memoir",
    secondaryGenre: "Silicon Valley",
    synopsis: "Based on forty extensive interviews, Isaacson narrates the fierce creativity, perfectionism, and reality distortion field of Apple\u2019s legendary co-founder.",
    quote: "The people who are crazy enough to think they can change the world are the ones who do.",
    whyYouWillLoveIt: "An unsparing, riveting chronicle of how design intuition, demonic drive, and artistic obsession revolutionized personal computing, music, and animation.",
    moodTags: ["Creative Intensity", "Silicon Legacy"],
    coverGradient: "from-[#455a64] via-[#2f3e45] to-[#1c252a]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-bio-2.jpg",
    isbn: "357010124X"
  },
  {
    id: "book-bio-3",
    title: "Shoe Dog",
    author: "Phil Knight",
    year: 2016,
    rating: 4.92,
    reviewCount: 6120,
    pages: 386,
    genre: "Biography & Memoir",
    secondaryGenre: "Nike Memoir",
    synopsis: "Nike founder Phil Knight shares the breathless, perilous inside story of borrowing $50 to import running shoes from Japan, enduring years on the brink of bankruptcy.",
    quote: "Don\u2019t tell people how to do things, tell them what to do and let them surprise you with their results.",
    whyYouWillLoveIt: "Warm, humble, and thrilling: captures the gritty romance of believing in an impossible crazy dream and never stopping.",
    moodTags: ["Electric Adrenaline", "Heartfelt Grit"],
    coverGradient: "from-[#8c5e43] via-[#65432f] to-[#3f291c]",
    coverTextColor: "#fdfbf7",
    coverImage: "/covers/book-bio-3.jpg",
    isbn: "1501135929"
  },
  // 10. Tech & AI
  {
    id: "book-tech-1",
    title: "Superintelligence: Paths, Dangers, Strategies",
    author: "Nick Bostrom",
    year: 2014,
    rating: 4.85,
    reviewCount: 3740,
    pages: 352,
    genre: "Tech & AI",
    secondaryGenre: "Existential Risk",
    synopsis: "Oxford philosopher Nick Bostrom maps out the trajectory toward Artificial General Intelligence, the intelligence explosion, and the foundational control problem.",
    quote: "Before the prospect of an intelligence explosion, we humans are like small children playing with a bomb.",
    whyYouWillLoveIt: "The intellectual genesis of modern AI safety, charting how humanity can steer destiny when cognitive machines surpass our biological horizon.",
    moodTags: ["Intellectual Labyrinth", "Frontier Foresight"],
    coverGradient: "from-[#2e3b32] via-[#1d2620] to-[#101512]",
    coverTextColor: "#e8f0eb",
    coverImage: "/covers/book-tech-1.jpg",
    isbn: "9781501227745"
  },
  {
    id: "book-tech-2",
    title: "Chip War: The Fight for the World\u2019s Most Critical Technology",
    author: "Chris Miller",
    year: 2022,
    rating: 4.9,
    reviewCount: 4210,
    pages: 464,
    genre: "Tech & AI",
    secondaryGenre: "Geopolitics & Silicon",
    synopsis: "A geopolitical thriller revealing how microscopic silicon chips became the most critical, contested resource on earth, and how Taiwan sits at the center of global power.",
    quote: "Semiconductors are the new oil\u2014the scarce resource that modern world civilization depends upon for survival.",
    whyYouWillLoveIt: "Essential reading on the physical underpinnings of the digital world, photolithography marvels, and the geopolitical battle for AI hardware.",
    moodTags: ["Electric Adrenaline", "Geopolitical Mastery"],
    coverGradient: "from-[#3a4454] via-[#252c36] to-[#14181e]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-tech-2.jpg",
    isbn: "9781982172015"
  },
  {
    id: "book-tech-3",
    title: "Co-Intelligence: Living and Working with AI",
    author: "Ethan Mollick",
    year: 2024,
    rating: 4.88,
    reviewCount: 3840,
    pages: 320,
    genre: "Tech & AI",
    secondaryGenre: "Human-AI Collaboration",
    synopsis: "Wharton professor Ethan Mollick presents the pragmatic, insightful playbook for partnering with Large Language Models as thinkers, mentors, and creative collaborators.",
    quote: "AI is not a tool; it is a collaborator. Invite it into your work, assign it roles, and stay in the loop.",
    whyYouWillLoveIt: "Clear, grounded, and deeply exciting: cuts through hype and doom to show how to multiply human capability today.",
    moodTags: ["Frontier Foresight", "Creative Empowerment"],
    coverGradient: "from-[#5c6e58] via-[#3b4738] to-[#20271e]",
    coverTextColor: "#f7f4ed",
    coverImage: "/covers/book-tech-3.jpg",
    isbn: "9780593716717"
  }
];

// src/server/dailyBooksService.ts
var DAILY_GENRES_LIST = [
  "Top Classics",
  "Best Fiction",
  "Self-Help",
  "Business & Leadership",
  "Startups & Entrepreneurship",
  "Money & Investing",
  "Philosophy",
  "Psychology",
  "Biography & Memoir",
  "Tech & AI"
];
var DAILY_GENRES = [
  { genre: "Top Classics", querySubject: "classic_literature", searchFallback: "classics literature" },
  { genre: "Best Fiction", querySubject: "fiction", searchFallback: "fiction masterpiece" },
  { genre: "Self-Help", querySubject: "self-help", searchFallback: "personal growth habits" },
  { genre: "Business & Leadership", querySubject: "leadership", searchFallback: "business management leadership" },
  { genre: "Startups & Entrepreneurship", querySubject: "entrepreneurship", searchFallback: "startups venture business" },
  { genre: "Money & Investing", querySubject: "investing", searchFallback: "investing stock market finance" },
  { genre: "Philosophy", querySubject: "philosophy", searchFallback: "philosophy wisdom" },
  { genre: "Psychology", querySubject: "psychology", searchFallback: "psychology human behavior" },
  { genre: "Biography & Memoir", querySubject: "biography", searchFallback: "biography memoir life" },
  { genre: "Tech & AI", querySubject: "artificial_intelligence", searchFallback: "artificial intelligence computer technology" }
];
var GRADIENTS = [
  "from-[#3a4454] via-[#2a3240] to-[#1c222b]",
  "from-[#705a4f] via-[#4a3b32] to-[#2b211a]",
  "from-[#5d4037] via-[#3e2723] to-[#201410]",
  "from-[#2b253b] via-[#1f192b] to-[#120e1c]",
  "from-[#2e3b32] via-[#202923] to-[#141a16]",
  "from-[#455a64] via-[#2f3e45] to-[#1c252a]",
  "from-[#5c6e58] via-[#3b4738] to-[#20271e]",
  "from-[#8c5e43] via-[#65432f] to-[#3f291c]"
];
function getTodayDateKey() {
  const d = /* @__PURE__ */ new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getTomorrowDateKey() {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getMsUntilMidnight() {
  const now = /* @__PURE__ */ new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}
var sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var onCatalogRefreshedCallback = null;
async function enrichBooksWithCovers(books) {
  const BATCH_SIZE = 4;
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (book) => {
        if (book.coverImage) return;
        const local = BOOKS_DATA.find(
          (b) => b.title.toLowerCase().trim() === book.title.toLowerCase().trim()
        );
        if (local?.coverImage) {
          book.coverImage = local.coverImage;
          return;
        }
        const mainTitle = book.title.split(/[:\-–—]/)[0].trim();
        const cleanAuthor = (book.author || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
        try {
          const q = cleanAuthor ? `${mainTitle} ${cleanAuthor}` : mainTitle;
          const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,cover_i,number_of_pages_median,first_publish_year`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 7e3);
          const olRes = await fetch(olUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "BookshelfApp/1.0 (daily-catalog-ai)" }
          });
          clearTimeout(timeout);
          if (olRes.ok) {
            const olData = await olRes.json();
            const docs = olData.docs || [];
            const match2 = docs.find((d) => d.cover_i && d.title?.toLowerCase().includes(mainTitle.toLowerCase())) || docs.find((d) => d.cover_i);
            if (match2?.cover_i) {
              book.coverImage = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match2.cover_i}-M.jpg`)}`;
              if (match2.number_of_pages_median && (!book.pages || book.pages === 320)) {
                book.pages = match2.number_of_pages_median;
              }
              if (match2.first_publish_year && (!book.year || book.year === 2020)) {
                book.year = match2.first_publish_year;
              }
              return;
            }
          }
        } catch {
        }
        try {
          const olUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(mainTitle)}&limit=5&fields=title,cover_i,number_of_pages_median,first_publish_year`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6e3);
          const olRes = await fetch(olUrl, {
            signal: controller.signal,
            headers: { "User-Agent": "BookshelfApp/1.0 (daily-catalog-ai)" }
          });
          clearTimeout(timeout);
          if (olRes.ok) {
            const olData = await olRes.json();
            const docs = olData.docs || [];
            const match2 = docs.find((d) => d.cover_i);
            if (match2?.cover_i) {
              book.coverImage = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match2.cover_i}-M.jpg`)}`;
              if (match2.number_of_pages_median && (!book.pages || book.pages === 320)) {
                book.pages = match2.number_of_pages_median;
              }
              if (match2.first_publish_year && (!book.year || book.year === 2020)) {
                book.year = match2.first_publish_year;
              }
            }
          }
        } catch {
        }
      })
    );
  }
  return books;
}
async function fetchDailyBooksFromAi(dateKey) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) return null;
  const models = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
  ];
  const prompt = `You are the Master Literary Curator for BookShelf.
Every day at 12:00 AM Midnight, you curate the 30 definitive masterworks for our 10 literary shelves for date: ${dateKey}.
For EACH of the following 10 genres, select exactly THREE (3) internationally acclaimed, high-rating (4.5+ stars), best-selling, widely reviewed books.
Do NOT choose obscure or random books. Only choose iconic bestsellers, modern essentials, award winners, and beloved classics.

The 10 genres are:
${DAILY_GENRES_LIST.map((g, i) => `${i + 1}. ${g}`).join("\n")}

Return ONLY a valid JSON object matching this schema:
{
  "curationDate": "${dateKey}",
  "genres": [
    {
      "genre": "Genre Name",
      "books": [
        {
          "title": "Exact Title",
          "author": "Author Name",
          "rating": 4.8,
          "reviewCount": 15000,
          "pages": 320,
          "year": 2018,
          "synopsis": "Original 1-sentence hook in your own words describing the book theme.",
          "whyYouWillLoveIt": "1 sentence why it is an essential bestseller in this genre."
        }
      ]
    }
  ]
}`;
  for (const model of models) {
    try {
      console.log(`[DailyCatalogAI] Calling Gemini model ${model} for midnight 12:00 AM refresh (${dateKey})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        })
      });
      if (!res.ok) {
        console.warn(`[DailyCatalogAI] Gemini model ${model} returned HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.genres) && parsed.genres.length >= 10) {
        const allBooks = [];
        let bookIdx = 0;
        for (const g of parsed.genres) {
          const genreName = g.genre;
          const genreBooks = (g.books || []).slice(0, 3);
          for (const b of genreBooks) {
            bookIdx++;
            allBooks.push({
              id: `ai-daily-${dateKey}-${genreName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${bookIdx}`,
              title: b.title,
              author: b.author,
              year: b.year || 2020,
              rating: typeof b.rating === "number" ? Number(b.rating.toFixed(2)) : 4.85,
              reviewCount: b.reviewCount || 12e3,
              pages: b.pages || 320,
              genre: genreName,
              secondaryGenre: `${genreName} Bestseller`,
              synopsis: b.synopsis || `An extraordinary, acclaimed bestseller in ${genreName}.`,
              quote: b.synopsis || `\u201CA transformative work that redefines our understanding of ${genreName.toLowerCase()}.\u201D`,
              whyYouWillLoveIt: b.whyYouWillLoveIt || `Curated as an essential bestseller in ${genreName} for today's vault.`,
              moodTags: [genreName, "AI Bestseller", "Daily Vault"],
              coverGradient: GRADIENTS[bookIdx % GRADIENTS.length],
              coverTextColor: "#f7f4ed",
              isbn: "AI-D-" + Math.random().toString().slice(2, 10)
            });
          }
        }
        await enrichBooksWithCovers(allBooks);
        console.log(`[DailyCatalogAI] Successfully generated & enriched 30 AI bestsellers across 10 genres for ${dateKey}!`);
        return allBooks;
      }
    } catch (err) {
      console.warn(`[DailyCatalogAI] Error on model ${model}:`, err);
      continue;
    }
  }
  return null;
}
async function fetchBooksForCategory(category, dateKey) {
  let hash = 0;
  const seedStr = `${dateKey}_${category.genre}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const offset = Math.abs(hash) % 40;
  const page = Math.abs(hash) % 6 + 1;
  try {
    const subjectUrl = `https://openlibrary.org/subjects/${category.querySubject}.json?limit=25&offset=${offset}`;
    const res = await fetch(subjectUrl, { headers: { "User-Agent": "BookshelfApp/1.0 (daily-catalog)" } });
    if (res.ok) {
      const data = await res.json();
      const works = data.works || [];
      const booksWithCover = works.filter((w) => !!(w.cover_id || w.cover_i));
      if (booksWithCover.length >= 3) {
        return booksWithCover.slice(0, 3).map((w, idx) => {
          const coverId = w.cover_id || w.cover_i;
          const author = w.authors?.[0]?.name || "Acclaimed Author";
          const title = w.title || "Untitled Work";
          const year = w.first_publish_year || 2020;
          const subjects = (w.subject || []).filter((s) => typeof s === "string").slice(0, 3);
          const firstSentence = typeof w.first_sentence === "string" ? w.first_sentence : w.first_sentence?.[0];
          return {
            id: `ol-${dateKey}-${category.genre.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx + 1}`,
            title,
            author,
            year,
            rating: Number((4.6 + Math.random() * 0.35).toFixed(2)),
            reviewCount: Math.floor(Math.random() * 4e3) + 1200,
            pages: Math.floor(Math.random() * 250) + 200,
            genre: category.genre,
            secondaryGenre: subjects[0] || category.genre,
            synopsis: firstSentence || `An extraordinary, thought-provoking masterwork exploring ${category.genre.toLowerCase()}, penned with profound clarity.`,
            quote: firstSentence || `In every era, great minds turn to ${category.genre.toLowerCase()} to distill the core of the human condition.`,
            whyYouWillLoveIt: `Recommended for today's daily vault: an essential reading in ${category.genre} that expands horizons and sparks deep reflection.`,
            moodTags: subjects.length > 0 ? subjects : [category.genre, "Daily Archive"],
            coverGradient: GRADIENTS[(Math.abs(hash) + idx) % GRADIENTS.length],
            coverTextColor: "#f7f4ed",
            coverImage: `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)}`,
            isbn: "OL-" + (w.key ? w.key.replace("/works/", "") : Math.random().toString().slice(2, 8))
          };
        });
      }
    }
  } catch (err) {
    console.warn(`[DailyCatalog] Subject fetch failed for ${category.genre}:`, err);
  }
  try {
    const fields = "key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence";
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(category.searchFallback)}&page=${page}&limit=15&fields=${fields}`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": "BookshelfApp/1.0 (daily-catalog)" } });
    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      const docsWithCover = docs.filter((d) => !!d.cover_i);
      if (docsWithCover.length >= 3) {
        return docsWithCover.slice(0, 3).map((d, idx) => {
          const coverId = d.cover_i;
          const author = d.author_name?.[0] || "Acclaimed Author";
          const title = d.title || "Untitled Work";
          const year = d.first_publish_year || 2021;
          const subjects = (d.subject || []).filter((s) => typeof s === "string").slice(0, 3);
          const firstSentence = typeof d.first_sentence === "string" ? d.first_sentence : d.first_sentence?.[0];
          return {
            id: `ol-${dateKey}-${category.genre.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${idx + 1}`,
            title,
            author,
            year,
            rating: Number((4.6 + Math.random() * 0.35).toFixed(2)),
            reviewCount: d.ratings_count || Math.floor(Math.random() * 4e3) + 1200,
            pages: d.number_of_pages_median || Math.floor(Math.random() * 250) + 200,
            genre: category.genre,
            secondaryGenre: subjects[0] || category.genre,
            synopsis: firstSentence || `An extraordinary, thought-provoking masterwork exploring ${category.genre.toLowerCase()}, penned with profound clarity.`,
            quote: firstSentence || `In every era, great minds turn to ${category.genre.toLowerCase()} to distill the core of the human condition.`,
            whyYouWillLoveIt: `Recommended for today's daily vault: an essential reading in ${category.genre} that expands horizons and sparks deep reflection.`,
            moodTags: subjects.length > 0 ? subjects : [category.genre, "Daily Archive"],
            coverGradient: GRADIENTS[(Math.abs(hash) + idx) % GRADIENTS.length],
            coverTextColor: "#f7f4ed",
            coverImage: `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)}`,
            isbn: "OL-" + (d.key ? d.key.replace("/works/", "") : Math.random().toString().slice(2, 8))
          };
        });
      }
    }
  } catch (err) {
    console.error(`[DailyCatalog] Search fallback failed for ${category.genre}:`, err);
  }
  const curated = BOOKS_DATA.filter((b) => b.genre.toLowerCase() === category.genre.toLowerCase());
  if (curated.length >= 3) {
    return curated.slice(0, 3);
  }
  return BOOKS_DATA.slice(0, 3);
}
async function refreshDailyCatalogForDate(db, dateKey) {
  console.log(`[DailyCatalog] Initiating 12:00 AM refresh for dateKey=${dateKey}...`);
  const aiBooks = await fetchDailyBooksFromAi(dateKey);
  let allDailyBooks = [];
  if (aiBooks && aiBooks.length >= 30) {
    allDailyBooks = aiBooks;
    console.log(`[DailyCatalog] AI Curation successful! 30 books generated for ${dateKey}.`);
  } else {
    console.log(`[DailyCatalog] AI unavailable, falling back to Open Library subject discovery for ${dateKey}...`);
    for (const category of DAILY_GENRES) {
      const books = await fetchBooksForCategory(category, dateKey);
      allDailyBooks.push(...books);
      await sleep2(200);
    }
  }
  await db.dailyCatalog.upsert({
    where: { dateKey },
    create: {
      dateKey,
      booksJson: allDailyBooks
    },
    update: {
      booksJson: allDailyBooks
    }
  });
  dailyCatalogCache.set(dateKey, { timestamp: Date.now(), books: allDailyBooks });
  if (onCatalogRefreshedCallback) {
    onCatalogRefreshedCallback(dateKey);
  }
  console.log(`[DailyCatalog] Successfully persisted 30 books for ${dateKey} to Neon PostgreSQL!`);
  return allDailyBooks;
}
var dailyCatalogCache = /* @__PURE__ */ new Map();
var DAILY_CACHE_TTL_MS = 12 * 60 * 60 * 1e3;
async function getDailyCatalog(db, dateKey = getTodayDateKey()) {
  const cached = dailyCatalogCache.get(dateKey);
  if (cached && Date.now() - cached.timestamp < DAILY_CACHE_TTL_MS) {
    return cached.books;
  }
  const existing = await db.dailyCatalog.findUnique({
    where: { dateKey },
    select: { booksJson: true }
  });
  if (existing && Array.isArray(existing.booksJson) && existing.booksJson.length >= 30) {
    const firstId = existing.booksJson[0]?.id || "";
    if (firstId.startsWith("ai-daily-") || firstId.startsWith("ol-")) {
      let books = existing.booksJson;
      const missingCovers = books.filter((b) => !b.coverImage);
      if (missingCovers.length > 0) {
        console.log(`[DailyCatalog] Auto-healing ${missingCovers.length} missing covers in ${dateKey} catalog...`);
        books = await enrichBooksWithCovers(books);
        await db.dailyCatalog.update({
          where: { dateKey },
          data: { booksJson: books }
        });
        console.log(`[DailyCatalog] \u2705 Auto-healed and persisted covers for ${dateKey}!`);
        if (onCatalogRefreshedCallback) {
          onCatalogRefreshedCallback(dateKey);
        }
      }
      dailyCatalogCache.set(dateKey, { timestamp: Date.now(), books });
      return books;
    }
  }
  console.log(`[DailyCatalog] Generating fresh AI-curated catalog for ${dateKey}...`);
  const freshBooks = await refreshDailyCatalogForDate(db, dateKey);
  return freshBooks;
}

// src/server/marginNotesService.ts
var INITIAL_MARGIN_NOTES = [
  {
    bookTitle: "The Memory Police",
    bookAuthor: "Y\u014Dko Ogawa",
    pageNumber: 142,
    passageSnippet: "\u201CIf you lose the memory of a perfume, does the flower still exist?\u201D",
    noteText: "Underlined this three times with my graphite pencil. It speaks so directly to how grief operates\u2014not as sudden erasure, but as slow quiet fog settling over rooms you once knew by heart.",
    readerName: "Elena Rostova",
    readerHandle: "@erostova",
    readerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    likes: 342,
    isTopPick: true,
    timestamp: "2 hours ago",
    comments: [
      {
        id: "c-1",
        readerName: "Julian Vance",
        readerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        text: "The perfume passage shattered me. Grief as atmospheric weather rather than an event.",
        createdAt: "1 hour ago"
      }
    ]
  },
  {
    bookTitle: "Exhalation",
    bookAuthor: "Ted Chiang",
    pageNumber: 88,
    passageSnippet: "\u201CThe universe began as an enormous breath held, and is slowly exhaling.\u201D",
    noteText: "The thermodynamic conceit of this story gave me goosebumps at midnight. It reconciles cold physics with cosmic gratitude.",
    readerName: "Julian Vance",
    readerHandle: "@jvance_reads",
    readerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    likes: 519,
    isTopPick: true,
    timestamp: "Yesterday",
    comments: [
      {
        id: "c-2",
        readerName: "Mira Thorne",
        readerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        text: "Ted Chiang captures awe like no one else. The slow exhale of existence is oddly comforting.",
        createdAt: "Yesterday"
      }
    ]
  },
  {
    bookTitle: "Days at the Morisaki Bookshop",
    bookAuthor: "Satoshi Yagisawa",
    pageNumber: 47,
    passageSnippet: "\u201CIn secondhand books, you read two lives: the author\u2019s story, and the ghost of the previous reader.\u201D",
    noteText: "Found a dried pressed ginkgo leaf tucked into my secondhand copy right here. I am leaving it for whoever borrows it next.",
    readerName: "Mira Thorne",
    readerHandle: "@mirathorne",
    readerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    likes: 289,
    isTopPick: true,
    timestamp: "3 days ago",
    comments: [
      {
        id: "c-3",
        readerName: "Elena Rostova",
        readerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        text: "Pressed leaves in old paperbacks are one of life\u2019s quietest joys.",
        createdAt: "2 days ago"
      }
    ]
  },
  {
    bookTitle: "Piranesi",
    bookAuthor: "Susanna Clarke",
    pageNumber: 210,
    passageSnippet: "\u201CThe Beauty of the House is immeasurable; its Kindness infinite.\u201D",
    noteText: "Piranesi\u2019s radical kindness in the face of complete isolation is the most refreshing literary tonic of the 21st century.",
    readerName: "Devon K.",
    readerHandle: "@devon_k",
    readerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    likes: 412,
    isTopPick: true,
    timestamp: "4 days ago",
    comments: []
  },
  {
    bookTitle: "The Myth of Sisyphus",
    bookAuthor: "Albert Camus",
    pageNumber: 121,
    passageSnippet: "\u201COne must imagine Sisyphus happy.\u201D",
    noteText: "To stare into absurdity and smile anyway\u2014not with despair, but with fierce defiance. This page changed how I greet every Monday morning.",
    readerName: "Marcus Aurel",
    readerHandle: "@stoic_reader",
    readerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    likes: 388,
    isTopPick: false,
    timestamp: "5 days ago",
    comments: []
  },
  {
    bookTitle: "Atomic Habits",
    bookAuthor: "James Clear",
    pageNumber: 27,
    passageSnippet: "\u201CYou do not rise to the level of your goals. You fall to the level of your systems.\u201D",
    noteText: "Dog-eared this corner and redrew my entire daily routine. Focus on the architecture, not the finish line.",
    readerName: "Clara Vance",
    readerHandle: "@clarav",
    readerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    likes: 475,
    isTopPick: false,
    timestamp: "6 days ago",
    comments: []
  },
  {
    bookTitle: "One Hundred Years of Solitude",
    bookAuthor: "Gabriel Garc\xEDa M\xE1rquez",
    pageNumber: 1,
    passageSnippet: "\u201CMany years later, as he faced the firing squad, Colonel Aureliano Buend\xEDa was to remember that distant afternoon when his father took him to discover ice.\u201D",
    noteText: "The greatest opening sentence in human history. The collision of impending death and childlike wonder in a single breath.",
    readerName: "Gabriel S.",
    readerHandle: "@macondo_echo",
    readerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    likes: 620,
    isTopPick: false,
    timestamp: "1 week ago",
    comments: []
  }
];
var hasCheckedSeed = false;
var topNotesCache = null;
var TOP_NOTES_TTL_MS = 60 * 1e3;
function invalidateTopNotesCache() {
  topNotesCache = null;
}
async function ensureSeedMarginNotes(db) {
  if (hasCheckedSeed) return;
  try {
    const count = await db.marginNote.count();
    if (count === 0) {
      console.log("[MarginNotesService] Seeding initial margin notes into database...");
      for (const note of INITIAL_MARGIN_NOTES) {
        await db.marginNote.create({
          data: {
            bookTitle: note.bookTitle,
            bookAuthor: note.bookAuthor,
            pageNumber: note.pageNumber,
            passageSnippet: note.passageSnippet,
            noteText: note.noteText,
            readerName: note.readerName,
            readerHandle: note.readerHandle,
            readerAvatar: note.readerAvatar,
            likes: note.likes,
            isTopPick: note.isTopPick,
            timestamp: note.timestamp,
            comments: note.comments
          }
        });
      }
      console.log("[MarginNotesService] Seeded successfully.");
    }
    hasCheckedSeed = true;
  } catch (err) {
    console.error("[MarginNotesService] Error checking/seeding margin notes:", err);
  }
}
async function getTopMarginNotes(db, limit = 4) {
  if (topNotesCache && Date.now() - topNotesCache.timestamp < TOP_NOTES_TTL_MS) {
    return topNotesCache.notes.slice(0, limit);
  }
  await ensureSeedMarginNotes(db);
  const notes = await db.marginNote.findMany({
    orderBy: [
      { isTopPick: "desc" },
      { likes: "desc" }
    ],
    take: limit
  });
  topNotesCache = { timestamp: Date.now(), notes };
  return notes;
}
async function getAllMarginNotes(db, query) {
  await ensureSeedMarginNotes(db);
  const where = {};
  if (query?.bookTitle && query.bookTitle !== "All") {
    where.bookTitle = {
      contains: query.bookTitle,
      mode: "insensitive"
    };
  }
  if (query?.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { bookTitle: { contains: term, mode: "insensitive" } },
      { passageSnippet: { contains: term, mode: "insensitive" } },
      { noteText: { contains: term, mode: "insensitive" } },
      { readerName: { contains: term, mode: "insensitive" } }
    ];
  }
  let orderBy = [{ createdAt: "desc" }];
  if (query?.sort === "top") {
    orderBy = [{ likes: "desc" }, { createdAt: "desc" }];
  } else if (query?.sort === "discussed") {
    orderBy = [{ likes: "desc" }];
  }
  const take = Math.min(query?.limit || 50, 100);
  const skip = query?.offset || 0;
  return await db.marginNote.findMany({
    where,
    orderBy,
    take,
    skip
  });
}

// src/server/archivistAiService.ts
var GRADIENTS2 = [
  "from-[#3a4454] via-[#2a3240] to-[#1c222b]",
  "from-[#705a4f] via-[#4a3b32] to-[#2b211a]",
  "from-[#5d4037] via-[#3e2723] to-[#201410]",
  "from-[#2b253b] via-[#1f192b] to-[#120e1c]",
  "from-[#2e3b32] via-[#202923] to-[#141a16]",
  "from-[#455a64] via-[#2f3e45] to-[#1c252a]",
  "from-[#5c6e58] via-[#3b4738] to-[#20271e]",
  "from-[#8c5e43] via-[#65432f] to-[#3f291c]"
];
function normalizeQueryKey(raw) {
  raw = raw.toLowerCase().replace(/&/g, " and ");
  return raw.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
var queryCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var MAX_QUERY_CACHE = 500;
function setQueryCache(key, response) {
  if (queryCache.size >= MAX_QUERY_CACHE) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) queryCache.delete(firstKey);
  }
  queryCache.set(key, { timestamp: Date.now(), response });
}
var geminiCircuitBrokenUntil = 0;
async function getArchivistAiRecommendations(rawQuery) {
  const query = rawQuery.trim();
  const normalizedKey = normalizeQueryKey(query);
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const cached = queryCache.get(normalizedKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (!(cached.response.source === "openlibrary_ai" && geminiKey && Date.now() > geminiCircuitBrokenUntil)) {
      console.log("[ArchivistAI] Serving from cache (0 API cost, 0 quota consumed):", query);
      return { ...cached.response, cached: true };
    }
  }
  let llmResult = null;
  let source = "openlibrary_ai";
  if (geminiKey && Date.now() > geminiCircuitBrokenUntil) {
    try {
      console.log("[ArchivistAI] Consulting Gemini for query:", query);
      llmResult = await callGemini(query, geminiKey);
      if (llmResult) {
        source = "gemini";
      } else {
        geminiCircuitBrokenUntil = Date.now() + 30 * 1e3;
      }
    } catch (err) {
      console.warn("[ArchivistAI] Gemini call failed, tripping brief circuit breaker:", err);
      geminiCircuitBrokenUntil = Date.now() + 30 * 1e3;
    }
  }
  if (!llmResult && openaiKey) {
    try {
      console.log("[ArchivistAI] Consulting OpenAI for query:", query);
      llmResult = await callOpenAi(query, openaiKey);
      if (llmResult) source = "openai";
    } catch (err) {
      console.warn("[ArchivistAI] OpenAI call failed:", err);
    }
  }
  if (!llmResult && groqKey) {
    try {
      console.log("[ArchivistAI] Consulting Groq for query:", query);
      llmResult = await callGroq(query, groqKey);
      if (llmResult) source = "groq";
    } catch (err) {
      console.warn("[ArchivistAI] Groq call failed:", err);
    }
  }
  if (!llmResult) {
    console.log("[ArchivistAI] Using Open Library dynamic situational discovery for:", query);
    llmResult = await fallbackOpenLibraryDiscovery(query);
    source = "openlibrary_ai";
  }
  const enrichedRecommendations = await Promise.all(
    llmResult.books.map(async (rec, i) => {
      const enrichedBook = await fetchBookMetadataFromOpenLibrary(rec.title, rec.author, i);
      return {
        book: enrichedBook,
        badge: rec.badge,
        rationale: rec.rationale
      };
    })
  );
  const response = {
    query,
    source,
    letter: llmResult.letter,
    recommendations: enrichedRecommendations,
    cached: false
  };
  setQueryCache(normalizedKey, response);
  return response;
}
async function callGemini(query, apiKey) {
  const systemPrompt = `You are the Master Literary Archivist of BookShelf, an analog sanctuary for discerning readers.
The reader provides a feeling, mood, dilemma, environment, reading goal, OR a specific quote, passage, concept, or phrase (e.g. "The hardest part is 0 to 1", "To be or not to be", "All happy families are alike", "build the future").

Your primary task:
1. Deep Prompt Analysis & Prioritization:
   - First, carefully analyze the user's inquiry: does it quote, describe, reference, or closely relate to a specific published book, core thesis, or author?
     * For example, "The hardest part is 0 to 1" or "0 to 1" directly references Peter Thiel's seminal book "Zero to One: Notes on Startups, or How to Build the Future".
     * "Move fast and break things" references books on early tech innovation.
     * "Atomic habits" or "tiny changes" references James Clear's "Atomic Habits".
     * "Man's search for meaning" references Viktor Frankl.
   - If the inquiry relates to or describes a specific book, that closest/target book MUST be your FIRST recommendation (Book #1).
   - Then, choose Book #2 and Book #3 as the two best acclaimed companion masterworks that deeply explore, complement, or debate that same central concept or journey.
   - If the inquiry is an open mood, atmosphere, or setting (e.g., "rainy day wanting romance", "in flight needing a quick thriller", "philosophical melancholy"), recommend the three most acclaimed published books in the world matching that exact atmosphere.
2. Write an evocative, poetic, warm Archivist's Letter (2-3 sentences) acknowledging the reader's exact quote, situation, or dilemma and announcing the three volumes pulled from the archives for them.
3. Recommend exactly THREE distinct, acclaimed, published books in the world.
4. For each book, provide:
   - title: exact published title (e.g. "Zero to One: Notes on Startups, or How to Build the Future")
   - author: author name (e.g. "Peter Thiel")
   - badge: a 2-3 word poetic accord badge (e.g. "The Core Thesis", "Harmonic Counterpart", "Foundational Accord")
   - rationale: a 2-sentence explanation of why this exact book answers their specific inquiry and how it directly relates to what they asked.

Return ONLY a valid JSON object matching this structure:
{
  "letter": "string",
  "books": [
    { "title": "string", "author": "string", "badge": "string", "rationale": "string" },
    { "title": "string", "author": "string", "badge": "string", "rationale": "string" },
    { "title": "string", "author": "string", "badge": "string", "rationale": "string" }
  ]
}`;
  const models = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
  ];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}

Reader's Inquiry: "${query}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        })
      });
      if (!res.ok) {
        console.warn(`[ArchivistAI] Gemini model ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.books) && parsed.books.length >= 3) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[ArchivistAI] Gemini call error on ${model}:`, err);
      continue;
    }
  }
  return null;
}
async function callOpenAi(query, apiKey) {
  const systemPrompt = `You are the Master Literary Archivist of BookShelf. The user describes their current mood, setting, or dilemma. Recommend 3 published books matching their exact feeling.
Return ONLY valid JSON:
{
  "letter": "poetic 2-3 sentence note from the archivist",
  "books": [
    { "title": "book title", "author": "author name", "badge": "2-3 word badge", "rationale": "2-sentence rationale tailored to their feeling" }
  ]
}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Reader inquiry: "${query}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error HTTP ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}
async function callGroq(query, apiKey) {
  const systemPrompt = `You are the Master Literary Archivist of BookShelf. Recommend 3 published books matching the user's mood.
Return ONLY valid JSON:
{
  "letter": "poetic 2-3 sentence note",
  "books": [
    { "title": "title", "author": "author", "badge": "badge", "rationale": "rationale" }
  ]
}`;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Reader inquiry: "${query}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });
  if (!res.ok) {
    throw new Error(`Groq API error HTTP ${res.status}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}
async function fallbackOpenLibraryDiscovery(query) {
  const cleanQ = query.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQ)}&limit=12&fields=key,title,author_name,cover_i,first_publish_year,subject`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "BookshelfApp/1.0 (archivist-fallback)" }
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const docsWithCovers = (searchData.docs || []).filter((d) => d.title && d.author_name?.[0] && d.cover_i);
      const docsToUse = docsWithCovers.length >= 3 ? docsWithCovers : (searchData.docs || []).filter((d) => d.title && d.author_name?.[0]);
      if (docsToUse.length >= 3) {
        const top3 = docsToUse.slice(0, 3);
        const badges = ["Archival Discovery", "Companion Reflection", "Resonant Volume"];
        const books = top3.map((d, idx) => ({
          title: d.title,
          author: Array.isArray(d.author_name) ? d.author_name[0] : d.author_name,
          badge: badges[idx] || "Curated Volume",
          rationale: `Retrieved from the archives to address your inquiry of "${query}". A profound literary work answering your thoughts.`
        }));
        const letter = `\u201CTraveler, our archives cross-referenced your inquiry of \xAB${query}\xBB against the world's literary canon. We retrieved these three volumes as the closest, most resonant works to accompany your contemplation.\u201D`;
        return { letter, books };
      }
    }
  } catch (err) {
    console.warn("[ArchivistAI] Direct Open Library search failed, falling back to situational subjects:", err);
  }
  const qLower = query.toLowerCase();
  let subject = "fiction";
  let settingDescriptor = "your present moment";
  let badgeTheme = "Archival Accord";
  if (/rain|rainy|cozy|storm|cloudy|tea/i.test(qLower)) {
    settingDescriptor = "a quiet rainy day";
    badgeTheme = "Rainy Solace";
  } else if (/flight|plane|travel|transit|airport|train/i.test(qLower)) {
    settingDescriptor = "your journey in transit";
    badgeTheme = "In-Transit Accord";
  } else if (/night|midnight|bed|dark|sleep/i.test(qLower)) {
    settingDescriptor = "the late quiet hours";
    badgeTheme = "Nocturnal Accord";
  } else if (/cafe|coffee|morning|sun/i.test(qLower)) {
    settingDescriptor = "a warm cafe morning";
    badgeTheme = "Morning Reflection";
  } else if (/outside|park|nature|garden|walk/i.test(qLower)) {
    settingDescriptor = "an open afternoon outdoors";
    badgeTheme = "Pastoral Resonance";
  }
  if (/romantic|romance|love|heartbreak|crush|passion/i.test(qLower)) {
    subject = "romance";
    if (!badgeTheme.includes("Rainy")) badgeTheme = "Romantic Resonance";
  } else if (/flight|plane|quick|short|fast/i.test(qLower) && /thriller|mystery|suspense|crime/i.test(qLower)) {
    subject = "thriller";
    badgeTheme = "High-Pulse Thriller";
  } else if (/quick|short|fast|breez|light/i.test(qLower)) {
    subject = "short_stories";
    badgeTheme = "Brisk Novella";
  } else if (/thriller|mystery|crime|detective|murder|suspense/i.test(qLower)) {
    subject = "thriller";
    badgeTheme = "Chilling Accord";
  } else if (/finance|money|invest|wealth|market|stock|rich|capital|startup|business|entrepreneur/i.test(qLower)) {
    subject = "investing";
    badgeTheme = "Fiscal Wisdom";
  } else if (/habit|productiv|growth|self.?help|discipline|focus|burnout/i.test(qLower)) {
    subject = "self-help";
    badgeTheme = "Clarity & Renewal";
  } else if (/philosophy|exist|meaning|melanchol|grief|sorrow|absurd/i.test(qLower)) {
    subject = "philosophy";
    badgeTheme = "Deep Contemplation";
  } else if (/sci.?fi|space|future|ai|tech|cyber/i.test(qLower)) {
    subject = "science_fiction";
    badgeTheme = "Cosmic Horizon";
  } else if (/fantasy|magic|dragon|myth/i.test(qLower)) {
    subject = "fantasy";
    badgeTheme = "Mythic Wonder";
  } else if (/biography|memoir|life|true story/i.test(qLower)) {
    subject = "biography";
    badgeTheme = "Living Chronicle";
  }
  try {
    const subjectUrl = `https://openlibrary.org/subjects/${subject}.json?limit=25`;
    const res = await fetch(subjectUrl, {
      headers: { "User-Agent": "BookshelfApp/1.0 (archivist-ai)" }
    });
    if (res.ok) {
      const data = await res.json();
      const works = (data.works || []).filter((w) => w.title && w.authors?.[0]?.name && w.cover_id);
      if (works.length >= 3) {
        const selected = works.slice(0, 3);
        const badges = [badgeTheme, "Harmonic Counterpart", "Archival Treasure"];
        const books = selected.map((w, idx) => {
          return {
            title: w.title,
            author: w.authors[0].name,
            badge: badges[idx] || "Curated Volume",
            rationale: `Selected by the Archivist for ${settingDescriptor}. This renowned work in ${subject.replace("_", " ")} offers the exact cadence and atmosphere your spirit inquired for.`
          };
        });
        const letter = `\u201CTraveler, for ${settingDescriptor} and your inquiry of \xAB${query}\xBB, the great archives have opened. We bypassed the common shelves and retrieved these three profound works from the vault to accompany your hours.\u201D`;
        return { letter, books };
      }
    }
  } catch (err) {
    console.warn("[ArchivistAI] Subject discovery failed, trying keyword fallback:", err);
  }
  return {
    letter: `\u201CThe shelves have parted for your contemplation of \xAB${query}\xBB. Here are three timeless masterworks retrieved to steady your thoughts and ignite your curiosity.\u201D`,
    books: [
      {
        title: "The Shadow of the Wind",
        author: "Carlos Ruiz Zaf\xF3n",
        badge: "Labyrinth Accord",
        rationale: `A spellbinding journey into the Cemetery of Forgotten Books that answers any search for mystery, atmosphere, and literary passion.`
      },
      {
        title: "Before the Coffee Gets Cold",
        author: "Toshikazu Kawaguchi",
        badge: "Cozy Solace",
        rationale: `Set in a quiet Tokyo cafe where a single cup allows travelers to revisit a cherished moment, ideal for quiet, reflective reading.`
      },
      {
        title: "A Man Called Ove",
        author: "Fredrik Backman",
        badge: "Heartfelt Resonance",
        rationale: `A tender, poignant comedy on community, unexpected friendships, and how ordinary lives touch each other in profound ways.`
      }
    ]
  };
}
async function fetchBookMetadataFromOpenLibrary(title, author, index) {
  const mainTitle = title.split(/[:\-–—]/)[0].trim().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ");
  const cleanTitle = title.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const cleanAuthor = author.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  let coverId = null;
  let year = 2020;
  let rating = 4.85;
  let reviewCount = 2840;
  let pages = 320;
  let subjects = [];
  let firstSentence = null;
  const searchUrls = [
    `https://openlibrary.org/search.json?title=${encodeURIComponent(mainTitle)}&author=${encodeURIComponent(cleanAuthor)}&limit=1&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence`,
    `https://openlibrary.org/search.json?q=${encodeURIComponent(mainTitle + " " + cleanAuthor)}&limit=1&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence`,
    `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&limit=1&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,number_of_pages_median,subject,first_sentence`
  ];
  for (const searchUrl of searchUrls) {
    try {
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "BookshelfApp/1.0 (archivist-enrich)" }
      });
      if (res.ok) {
        const data = await res.json();
        const doc = data.docs?.[0];
        if (doc) {
          if (doc.cover_i) coverId = doc.cover_i;
          if (doc.first_publish_year) year = doc.first_publish_year;
          if (doc.ratings_average) rating = Number(doc.ratings_average.toFixed(2));
          if (doc.ratings_count) reviewCount = doc.ratings_count;
          if (doc.number_of_pages_median) pages = doc.number_of_pages_median;
          if (doc.subject) subjects = (doc.subject || []).filter((s) => typeof s === "string").slice(0, 3);
          firstSentence = typeof doc.first_sentence === "string" ? doc.first_sentence : doc.first_sentence?.[0] || null;
          if (coverId) break;
        }
      }
    } catch (err) {
      console.warn(`[ArchivistAI] Could not enrich metadata for "${title}":`, err);
    }
  }
  const idSlug = (title + "-" + author).toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 32);
  return {
    id: `ai-${idSlug}-${Date.now().toString().slice(-4)}-${index}`,
    title,
    author,
    year,
    rating: rating || 4.85,
    reviewCount: reviewCount || 2400,
    pages: pages || 310,
    genre: subjects[0] || "Literary Fiction",
    secondaryGenre: subjects[1] || "Archivist Discovery",
    synopsis: firstSentence || `An extraordinary, deeply resonant volume recommended by the Archivist for its emotional depth and singular literary voice.`,
    quote: firstSentence || `\u201CBooks are the mirrors of the soul, reflecting back precisely the truth we are prepared to behold.\u201D`,
    whyYouWillLoveIt: `Hand-selected by the AI Archivist to precisely match your inquiry: offers an unforgettable journey into ${subjects.join(", ") || "the human condition"}.`,
    moodTags: subjects.length > 0 ? subjects : ["Archivist Recommendation", "Nuanced Craft"],
    coverGradient: GRADIENTS2[index % GRADIENTS2.length],
    coverTextColor: "#f7f4ed",
    coverImage: coverId ? `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)}` : void 0,
    isbn: "AI-" + Math.random().toString().slice(2, 10)
  };
}

// src/data/communityData.ts
var READING_CIRCLES_DATA = [
  {
    id: "circle-1",
    name: "Midnight Speculative Guild",
    currentBook: "Exhalation",
    author: "Ted Chiang",
    membersCount: 840,
    meetingDate: "Thursday, 8:00 PM EST",
    topic: "Free Will, Entropy, and the Prism of Consciousness",
    coverGradient: "from-[#1e2738] to-[#121620]"
  },
  {
    id: "circle-2",
    name: "Tokyo Coffee & Quiet Prose",
    currentBook: "Days at the Morisaki Bookshop",
    author: "Satoshi Yagisawa",
    membersCount: 1220,
    meetingDate: "Sunday, 10:00 AM JST",
    topic: "Secondhand Book Culture and Healing in Jimbocho",
    coverGradient: "from-[#4d3324] to-[#26180f]"
  },
  {
    id: "circle-3",
    name: "The Gothic Bibliotheca",
    currentBook: "The Shadow of the Wind",
    author: "Carlos Ruiz Zaf\xF3n",
    membersCount: 960,
    meetingDate: "Saturday, 7:00 PM CET",
    topic: "Cemetery of Forgotten Books: Literature as Salvation",
    coverGradient: "from-[#2e1d3d] to-[#160d1f]"
  }
];

// src/server/apiHandler.ts
try {
  if (typeof process !== "undefined" && typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
}
if (process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
}
function getTunedDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) return "";
  try {
    const u = new URL(dbUrl);
    u.searchParams.set("connection_limit", "30");
    u.searchParams.set("pool_timeout", "20");
    u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch {
    const sep = dbUrl.includes("?") ? "&" : "?";
    return `${dbUrl}${sep}connection_limit=30&pool_timeout=20&pgbouncer=true`;
  }
}
var globalForPrisma = globalThis;
function getPrisma() {
  const tunedUrl = getTunedDatabaseUrl();
  if (!tunedUrl) {
    throw new Error("DATABASE_URL environment variable is missing in Vercel. Please add DATABASE_URL under Project Settings > Environment Variables.");
  }
  if (!globalForPrisma.prisma || !globalForPrisma.prisma.readingCircle) {
    process.env.DATABASE_URL = tunedUrl;
    globalForPrisma.prisma = new PrismaClient({
      datasources: { db: { url: tunedUrl } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
  }
  return globalForPrisma.prisma;
}
function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => {
      resolve({});
    });
  });
}
var coverCache = /* @__PURE__ */ new Map();
var COVER_CACHE_MAX_ENTRIES = 500;
var COVER_CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1e3;
var serializedDailyCache = /* @__PURE__ */ new Map();
var coverLookupCache = /* @__PURE__ */ new Map();
function generateParchmentSvgFallback(title = "Archived Volume") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
    <rect width="300" height="450" fill="#f4efe6" rx="4"/>
    <rect x="8" y="8" width="284" height="434" fill="none" stroke="#d5cdbe" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="16" y="16" width="268" height="418" fill="none" stroke="#e8e2d5" stroke-width="1"/>
    <path d="M24 0 L24 450" stroke="#d5cdbe" stroke-width="2"/>
    <circle cx="150" cy="180" r="36" fill="#8c5e43" opacity="0.12"/>
    <path d="M140 170 L150 160 L160 170 L150 180 Z" fill="#8c5e43"/>
    <text x="150" y="240" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#2b211a" text-anchor="middle" letter-spacing="1">BOOKSHELF SANCTUARY</text>
    <text x="150" y="265" font-family="Georgia, serif" font-size="11" fill="#705a4f" text-anchor="middle" font-style="italic">${title}</text>
    <line x1="80" y1="285" x2="220" y2="285" stroke="#d5cdbe" stroke-width="0.75"/>
  </svg>`;
}
var rateLimitStore = /* @__PURE__ */ new Map();
function checkRateLimit(ip, maxHits, windowMs) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxHits) {
    return false;
  }
  record.count++;
  return true;
}
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(ip);
      }
    }
  }, 3e5);
  timer.unref?.();
}
function getClientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || "127.0.0.1";
}
async function getVerifiedClerkUserId(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  try {
    const verified = await verifyToken2(token, { secretKey });
    return verified?.sub || null;
  } catch (err) {
    console.warn("[AuthGuard] Clerk session token verification failed:", err);
    return null;
  }
}
function isAllowedCoverUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" || host.endsWith(".local") || host.endsWith(".internal") || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) || /^169\.254\./.test(host)) {
      return false;
    }
    const allowedHosts = [
      "covers.openlibrary.org",
      "openlibrary.org",
      "images.unsplash.com",
      "books.google.com",
      "books.googleusercontent.com",
      "archive.org"
    ];
    return allowedHosts.some((allowed) => host === allowed || host.endsWith("." + allowed));
  } catch {
    return false;
  }
}
async function handleApiRequest(req, res) {
  const rawUrl = req.url || "/";
  const parsedUrl = new URL(rawUrl, "http://localhost");
  let pathname = parsedUrl.pathname.replace(/\/$/, "") || "/";
  if ((pathname === "/api" || pathname === "") && req.query?.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    pathname = `/api/${segments}`.replace(/\/$/, "");
  }
  if (!pathname.startsWith("/api")) {
    return false;
  }
  const origin = req.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  if (pathname === "/api/profile") {
    if (req.method === "GET") {
      try {
        const db = getPrisma();
        const verifiedUserId = await getVerifiedClerkUserId(req);
        const queryClerkId = parsedUrl.searchParams.get("clerkId");
        const email = parsedUrl.searchParams.get("email");
        const clerkId = verifiedUserId || queryClerkId;
        if (!clerkId && !email) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing clerkId or email" }));
          return true;
        }
        const conditions = [];
        if (clerkId) conditions.push({ clerkId });
        if (email) conditions.push({ email });
        const profile = await db.profile.findFirst({
          where: { OR: conditions }
        });
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ profile }));
      } catch (err) {
        console.error("Error fetching profile from Prisma:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Database query failed" }));
      }
      return true;
    }
    if (req.method === "POST") {
      try {
        const db = getPrisma();
        const body = await parseJsonBody(req);
        const verifiedUserId = await getVerifiedClerkUserId(req);
        const clerkId = verifiedUserId || body.clerkId;
        const identifier = clerkId || body.email;
        if (!identifier) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing clerkId or email" }));
          return true;
        }
        let existing = null;
        if (clerkId) {
          existing = await db.profile.findFirst({ where: { clerkId } });
        }
        if (!existing && body.email) {
          existing = await db.profile.findFirst({ where: { email: body.email } });
        }
        let profile;
        if (existing) {
          profile = await db.profile.update({
            where: { id: existing.id },
            data: {
              clerkId: clerkId || existing.clerkId,
              email: body.email || existing.email,
              firstName: body.firstName !== void 0 ? body.firstName : existing.firstName,
              lastName: body.lastName !== void 0 ? body.lastName : existing.lastName,
              scholarlyRank: body.scholarlyRank !== void 0 ? body.scholarlyRank : existing.scholarlyRank,
              personalities: body.personalities !== void 0 ? body.personalities : existing.personalities,
              selectedGenres: body.selectedGenres !== void 0 ? body.selectedGenres : existing.selectedGenres,
              tasteProfile: body.tasteProfile !== void 0 ? body.tasteProfile : existing.tasteProfile,
              memberSince: body.memberSince || existing.memberSince,
              challengeGoal: body.challengeGoal !== void 0 ? body.challengeGoal : existing.challengeGoal,
              booksRead: body.booksRead !== void 0 ? body.booksRead : existing.booksRead,
              pagesRead: body.pagesRead !== void 0 ? body.pagesRead : existing.pagesRead,
              marginNotesCount: body.marginNotesCount !== void 0 ? body.marginNotesCount : existing.marginNotesCount,
              guildsJoined: body.guildsJoined !== void 0 ? body.guildsJoined : existing.guildsJoined,
              isOnboarded: body.isOnboarded !== void 0 ? body.isOnboarded : true,
              bookmarks: body.bookmarks !== void 0 ? body.bookmarks : existing.bookmarks,
              joinedCircles: body.joinedCircles !== void 0 ? body.joinedCircles : existing.joinedCircles,
              shelfBooks: body.shelfBooks !== void 0 ? body.shelfBooks : existing.shelfBooks
            }
          });
        } else {
          profile = await db.profile.create({
            data: {
              clerkId: clerkId || body.email || `clerk_${Date.now()}`,
              email: body.email || clerkId || `user_${Date.now()}@bookshelf.sanctuary`,
              firstName: body.firstName || "",
              lastName: body.lastName || "",
              scholarlyRank: body.scholarlyRank || "Bibliophile Scholar",
              personalities: body.personalities || [],
              selectedGenres: body.selectedGenres || [],
              tasteProfile: body.tasteProfile || "",
              memberSince: body.memberSince || "",
              challengeGoal: body.challengeGoal ?? 12,
              booksRead: body.booksRead ?? 0,
              pagesRead: body.pagesRead ?? 0,
              marginNotesCount: body.marginNotesCount ?? 0,
              guildsJoined: body.guildsJoined ?? 0,
              isOnboarded: body.isOnboarded !== void 0 ? body.isOnboarded : true,
              bookmarks: body.bookmarks || [],
              joinedCircles: body.joinedCircles || [],
              shelfBooks: body.shelfBooks || []
            }
          });
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ profile }));
      } catch (err) {
        console.error("Error saving profile to Prisma:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Failed to persist profile", details: err?.message }));
      }
      return true;
    }
  }
  if (pathname === "/api/profile/shelf" && req.method === "POST") {
    try {
      const db = getPrisma();
      const body = await parseJsonBody(req);
      const verifiedUserId = await getVerifiedClerkUserId(req);
      const clerkId = verifiedUserId || body.clerkId;
      const identifier = clerkId || body.email;
      if (!identifier) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing clerkId or email" }));
        return true;
      }
      let existing = null;
      if (clerkId) existing = await db.profile.findFirst({ where: { clerkId } });
      if (!existing && body.email) existing = await db.profile.findFirst({ where: { email: body.email } });
      if (!existing) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Profile not found" }));
        return true;
      }
      let currentShelf = Array.isArray(existing.shelfBooks) ? existing.shelfBooks : [];
      const { action, book, status, yearRead } = body;
      if (action === "add" || action === "update") {
        currentShelf = currentShelf.filter((item) => item.book?.id !== book?.id && item.bookId !== book?.id);
        currentShelf.unshift({
          book,
          status: status || "read",
          yearRead: status === "read" ? yearRead || (/* @__PURE__ */ new Date()).getFullYear() : void 0,
          dateAdded: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (action === "remove") {
        currentShelf = currentShelf.filter((item) => item.book?.id !== book?.id && item.bookId !== book?.id && item.book?.id !== body.bookId && item.bookId !== body.bookId);
      }
      const readBooks = currentShelf.filter((item) => item.status === "read");
      const totalPages = readBooks.reduce((sum, item) => sum + (Number(item.book?.pages) || 0), 0);
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const readThisYear = readBooks.filter((item) => item.yearRead === currentYear);
      const updatedProfile = await db.profile.update({
        where: { id: existing.id },
        data: {
          shelfBooks: currentShelf,
          pagesRead: totalPages,
          booksRead: readThisYear.length
        }
      });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ profile: updatedProfile, shelfBooks: currentShelf }));
    } catch (err) {
      console.error("Error updating shelf:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to update shelf", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/circles") {
    if (req.method === "GET") {
      try {
        const db = getPrisma();
        const dbCircles = await db.readingCircle.findMany({
          orderBy: { createdAt: "desc" }
        });
        const dbIds = new Set(dbCircles.map((c) => c.id));
        const nonDupeSeed = READING_CIRCLES_DATA.filter((c) => !dbIds.has(c.id));
        const circles = [...dbCircles, ...nonDupeSeed];
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ circles }));
      } catch (err) {
        console.error("Error fetching circles from database:", err);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ circles: READING_CIRCLES_DATA, warning: err?.message }));
      }
      return true;
    }
    if (req.method === "POST") {
      try {
        const db = getPrisma();
        const body = await parseJsonBody(req);
        const { name, currentBook, author, meetingDate, topic, coverGradient, founderEmail, founderName } = body;
        if (!name || !currentBook) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Circle name and inaugural book are required" }));
          return true;
        }
        const cleanFounderEmail = founderEmail ? founderEmail.trim().toLowerCase() : "";
        const newCircle = await db.readingCircle.create({
          data: {
            name: name.trim(),
            currentBook: currentBook.trim(),
            author: author ? author.trim() : "Acclaimed Author",
            meetingDate: meetingDate ? meetingDate.trim() : "Sundays, 7:00 PM EST",
            topic: topic ? topic.trim() : "Literary Exploration & Shared Reflection",
            coverGradient: coverGradient || "from-[#1e2738] to-[#121620]",
            founderEmail: cleanFounderEmail,
            founderName: founderName ? founderName.trim() : "Fellow Scholar",
            membersCount: 1,
            joinedEmails: cleanFounderEmail ? [cleanFounderEmail] : []
          }
        });
        if (cleanFounderEmail) {
          const founderProfile = await db.profile.findFirst({ where: { email: cleanFounderEmail } });
          if (founderProfile) {
            const currentJoined = Array.isArray(founderProfile.joinedCircles) ? founderProfile.joinedCircles : [];
            if (!currentJoined.includes(newCircle.id)) {
              await db.profile.update({
                where: { id: founderProfile.id },
                data: {
                  joinedCircles: [...currentJoined, newCircle.id],
                  guildsJoined: currentJoined.length + 1
                }
              });
            }
          }
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ circle: newCircle }));
      } catch (err) {
        console.error("Error founding circle:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Failed to found reading circle", details: err?.message }));
      }
      return true;
    }
    if (req.method === "PUT" || req.method === "PATCH") {
      try {
        const db = getPrisma();
        const body = await parseJsonBody(req);
        const { id, name, currentBook, author, meetingDate, topic, userEmail } = body;
        if (!id || !name || !currentBook) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing required fields (id, name, currentBook)" }));
          return true;
        }
        const cleanUserEmail = userEmail ? userEmail.trim().toLowerCase() : "";
        let circle = await db.readingCircle.findUnique({ where: { id } });
        if (!circle) {
          const seed = READING_CIRCLES_DATA.find((c) => c.id === id);
          if (!seed) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Reading circle not found" }));
            return true;
          }
          if (seed.founderEmail && cleanUserEmail && seed.founderEmail.toLowerCase() !== cleanUserEmail) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Only the founder can edit this reading salon" }));
            return true;
          }
          circle = await db.readingCircle.create({
            data: {
              id: seed.id,
              name: name.trim(),
              currentBook: currentBook.trim(),
              author: author ? author.trim() : seed.author,
              meetingDate: meetingDate ? meetingDate.trim() : seed.meetingDate,
              topic: topic ? topic.trim() : seed.topic,
              coverGradient: seed.coverGradient,
              coverImage: seed.coverImage,
              membersCount: seed.membersCount,
              founderEmail: seed.founderEmail || cleanUserEmail,
              founderName: seed.founderName || "Fellow Scholar"
            }
          });
        } else {
          if (circle.founderEmail && cleanUserEmail && circle.founderEmail.toLowerCase() !== cleanUserEmail) {
            res.statusCode = 403;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Only the salon founder can edit this circle" }));
            return true;
          }
          circle = await db.readingCircle.update({
            where: { id },
            data: {
              name: name.trim(),
              currentBook: currentBook.trim(),
              author: author ? author.trim() : circle.author,
              meetingDate: meetingDate ? meetingDate.trim() : circle.meetingDate,
              topic: topic ? topic.trim() : circle.topic
            }
          });
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ circle }));
      } catch (err) {
        console.error("Error updating circle:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Failed to update reading circle", details: err?.message }));
      }
      return true;
    }
  }
  if (pathname === "/api/circles/join" && req.method === "POST") {
    try {
      const db = getPrisma();
      const body = await parseJsonBody(req);
      const { circleId, userEmail, action } = body;
      if (!circleId) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing circleId" }));
        return true;
      }
      const dbCircle = await db.readingCircle.findUnique({ where: { id: circleId } });
      if (dbCircle) {
        let joinedEmails = Array.isArray(dbCircle.joinedEmails) ? [...dbCircle.joinedEmails] : [];
        if (action === "join" && userEmail && !joinedEmails.includes(userEmail)) {
          joinedEmails.push(userEmail);
        } else if (action === "leave" && userEmail) {
          joinedEmails = joinedEmails.filter((e) => e !== userEmail);
        }
        const newCount = Math.max(1, dbCircle.membersCount + (action === "join" ? 1 : -1));
        await db.readingCircle.update({
          where: { id: circleId },
          data: {
            joinedEmails,
            membersCount: newCount
          }
        });
      }
      if (userEmail) {
        const profile = await db.profile.findFirst({ where: { email: userEmail } });
        if (profile) {
          let currentJoined = Array.isArray(profile.joinedCircles) ? [...profile.joinedCircles] : [];
          if (action === "join" && !currentJoined.includes(circleId)) {
            currentJoined.push(circleId);
          } else if (action === "leave") {
            currentJoined = currentJoined.filter((id) => id !== circleId);
          }
          await db.profile.update({
            where: { id: profile.id },
            data: {
              joinedCircles: currentJoined,
              guildsJoined: currentJoined.length
            }
          });
        }
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error("Error joining/leaving circle:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to update membership", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/books/daily" && req.method === "GET") {
    try {
      const db = getPrisma();
      const requestedDate = parsedUrl.searchParams.get("dateKey") || getTodayDateKey();
      const forceRefresh = parsedUrl.searchParams.get("refresh") === "true";
      const cached = serializedDailyCache.get(requestedDate);
      const cachedStr = cached ? cached.buffer.toString("utf8") : "";
      const cachedHasCovers = cachedStr.includes('"coverImage"');
      if (!forceRefresh && cached && cachedHasCovers && Date.now() - cached.timestamp < 12 * 60 * 60 * 1e3) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Length", cached.buffer.length);
        res.end(cached.buffer);
        return true;
      }
      const books = forceRefresh ? await refreshDailyCatalogForDate(db, requestedDate) : await getDailyCatalog(db, requestedDate);
      const payload = JSON.stringify({
        dateKey: requestedDate,
        books,
        total: books.length,
        refreshesAt: "12:00 AM Daily"
      });
      const buffer = Buffer.from(payload);
      serializedDailyCache.set(requestedDate, { timestamp: Date.now(), buffer });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);
    } catch (err) {
      console.error("Error fetching daily books:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to fetch daily catalog", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/books/daily/refresh" && (req.method === "POST" || req.method === "GET")) {
    try {
      const db = getPrisma();
      const body = req.method === "POST" ? await parseJsonBody(req) : {};
      const targetDate = body.dateKey || parsedUrl.searchParams.get("dateKey") || getTodayDateKey();
      const existing = await db.dailyCatalog.findUnique({
        where: { dateKey: targetDate },
        select: { booksJson: true }
      });
      if (existing && Array.isArray(existing.booksJson) && existing.booksJson.length >= 30) {
        const firstId = existing.booksJson[0]?.id || "";
        if (firstId.startsWith("ai-daily-") && !body.force && parsedUrl.searchParams.get("force") !== "true") {
          console.log(`[API /api/books/daily/refresh] Serving existing AI catalog for ${targetDate} (quota preserved)`);
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              success: true,
              message: `Catalog already up to date for ${targetDate}`,
              dateKey: targetDate,
              books: existing.booksJson,
              total: existing.booksJson.length
            })
          );
          return true;
        }
      }
      console.log(`[API /api/books/daily/refresh] Refreshing AI catalog for dateKey=${targetDate}`);
      serializedDailyCache.delete(targetDate);
      const books = await refreshDailyCatalogForDate(db, targetDate);
      serializedDailyCache.delete(targetDate);
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: true,
          message: `AI Catalog refreshed for ${targetDate}`,
          dateKey: targetDate,
          books,
          total: books.length
        })
      );
    } catch (err) {
      console.error("Error refreshing daily books:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to refresh daily catalog", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/books/daily/status" && req.method === "GET") {
    const ms = getMsUntilMidnight();
    const hoursUntil = (ms / (1e3 * 60 * 60)).toFixed(2);
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        today: getTodayDateKey(),
        tomorrow: getTomorrowDateKey(),
        nextMidnightInMs: ms,
        hoursUntilMidnight: hoursUntil,
        scheduledTime: "12:00:00 AM"
      })
    );
    return true;
  }
  if (pathname === "/api/cover-lookup" && req.method === "GET") {
    const title = parsedUrl.searchParams.get("title") || "";
    const author = parsedUrl.searchParams.get("author") || "";
    if (!title) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Title required" }));
      return true;
    }
    const cacheKey = `${title.toLowerCase().trim()}_${author.toLowerCase().trim()}`;
    if (coverLookupCache.has(cacheKey)) {
      const cachedCover = coverLookupCache.get(cacheKey);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ coverImage: cachedCover }));
      return true;
    }
    const localMatch = BOOKS_DATA.find(
      (b) => b.title.toLowerCase().trim() === title.toLowerCase().trim()
    );
    if (localMatch?.coverImage) {
      coverLookupCache.set(cacheKey, localMatch.coverImage);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ coverImage: localMatch.coverImage }));
      return true;
    }
    try {
      const mainTitle = title.split(/[:\-–—]/)[0].trim();
      const cleanAuthor = author.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      const q = cleanAuthor ? `${mainTitle} ${cleanAuthor}` : mainTitle;
      const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,cover_i`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6e3);
      const olRes = await fetch(olUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "BookshelfApp/1.0 (cover-lookup)" }
      });
      clearTimeout(timeout);
      if (olRes.ok) {
        const olData = await olRes.json();
        const docs = olData.docs || [];
        const match2 = docs.find((d) => d.cover_i && d.title?.toLowerCase().includes(mainTitle.toLowerCase())) || docs.find((d) => d.cover_i);
        if (match2?.cover_i) {
          const coverUrl = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match2.cover_i}-M.jpg`)}`;
          coverLookupCache.set(cacheKey, coverUrl);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ coverImage: coverUrl }));
          return true;
        }
      }
    } catch {
    }
    try {
      const mainTitle = title.split(/[:\-–—]/)[0].trim();
      const olUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(mainTitle)}&limit=5&fields=title,cover_i`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5e3);
      const olRes = await fetch(olUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "BookshelfApp/1.0 (cover-lookup)" }
      });
      clearTimeout(timeout);
      if (olRes.ok) {
        const olData = await olRes.json();
        const docs = olData.docs || [];
        const match2 = docs.find((d) => d.cover_i);
        if (match2?.cover_i) {
          const coverUrl = `/api/cover-proxy?url=${encodeURIComponent(`https://covers.openlibrary.org/b/id/${match2.cover_i}-M.jpg`)}`;
          coverLookupCache.set(cacheKey, coverUrl);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ coverImage: coverUrl }));
          return true;
        }
      }
    } catch {
    }
    coverLookupCache.set(cacheKey, null);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ coverImage: null }));
    return true;
  }
  if (pathname === "/api/cover-proxy" && (req.method === "GET" || req.method === "HEAD")) {
    const targetUrl = parsedUrl.searchParams.get("url");
    if (!targetUrl) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(generateParchmentSvgFallback("Invalid URL"));
      return true;
    }
    const isHttpOrHttps = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
    if (!isHttpOrHttps) {
      let cachedFallback = coverCache.get(targetUrl);
      const ttl2 = cachedFallback?.ttl || COVER_CACHE_TTL_MS;
      if (!cachedFallback || Date.now() - cachedFallback.timestamp >= ttl2) {
        const svg = generateParchmentSvgFallback(targetUrl === "archived_volume_fallback" ? "Archived Volume" : targetUrl);
        const buffer = Buffer.from(svg, "utf8");
        cachedFallback = { buffer, contentType: "image/svg+xml", timestamp: Date.now(), ttl: COVER_CACHE_TTL_MS };
        if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
          const oldestKey = coverCache.keys().next().value;
          if (oldestKey) coverCache.delete(oldestKey);
        }
        coverCache.set(targetUrl, cachedFallback);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Content-Length", cachedFallback.buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(cachedFallback.buffer);
      return true;
    }
    if (!isAllowedCoverUrl(targetUrl)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(generateParchmentSvgFallback("Restricted Host"));
      return true;
    }
    const cached = coverCache.get(targetUrl);
    const ttl = cached?.ttl || COVER_CACHE_TTL_MS;
    if (cached && Date.now() - cached.timestamp < ttl) {
      res.statusCode = 200;
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Content-Length", cached.buffer.length);
      res.setHeader("Cache-Control", cached.contentType === "image/svg+xml" ? "public, max-age=3600" : "public, max-age=604800, immutable");
      res.end(cached.buffer);
      return true;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6e3);
      const upstream = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timeout);
      if (!upstream.ok) {
        const svg = generateParchmentSvgFallback();
        const buffer2 = Buffer.from(svg, "utf8");
        if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
          const oldestKey = coverCache.keys().next().value;
          if (oldestKey) coverCache.delete(oldestKey);
        }
        coverCache.set(targetUrl, { buffer: buffer2, contentType: "image/svg+xml", timestamp: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS });
        res.statusCode = 200;
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Content-Length", buffer2.length);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end(buffer2);
        return true;
      }
      const cType = upstream.headers.get("content-type") || "image/jpeg";
      const arrayBuf = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
        const oldestKey = coverCache.keys().next().value;
        if (oldestKey) coverCache.delete(oldestKey);
      }
      coverCache.set(targetUrl, { buffer, contentType: cType, timestamp: Date.now(), ttl: COVER_CACHE_TTL_MS });
      res.statusCode = 200;
      res.setHeader("Content-Type", cType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.end(buffer);
    } catch {
      const svg = generateParchmentSvgFallback();
      const buffer = Buffer.from(svg, "utf8");
      if (coverCache.size >= COVER_CACHE_MAX_ENTRIES) {
        const oldestKey = coverCache.keys().next().value;
        if (oldestKey) coverCache.delete(oldestKey);
      }
      coverCache.set(targetUrl, { buffer, contentType: "image/svg+xml", timestamp: Date.now(), ttl: NEGATIVE_CACHE_TTL_MS });
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.end(buffer);
    }
    return true;
  }
  if (pathname === "/api/archivist/consult" && req.method === "POST") {
    const ip = getClientIp(req);
    if (!checkRateLimit(`archivist_${ip}`, 20, 6e4)) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "The Archivist is currently overwhelmed. Please allow a quiet moment before inquiring again." }));
      return true;
    }
    try {
      const body = await parseJsonBody(req);
      const query = body?.query;
      if (!query || typeof query !== "string" || !query.trim()) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Query is required" }));
        return true;
      }
      const result = await getArchivistAiRecommendations(query.trim());
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error("[API /api/archivist/consult] Error:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Archivist consultation failed", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/margin-notes") {
    if (req.method === "GET") {
      try {
        const db = getPrisma();
        const isTop = parsedUrl.searchParams.get("top") === "true";
        const limit = parseInt(parsedUrl.searchParams.get("limit") || "4", 10);
        const search = parsedUrl.searchParams.get("search") || void 0;
        const bookTitle = parsedUrl.searchParams.get("bookTitle") || void 0;
        const sort = parsedUrl.searchParams.get("sort") || void 0;
        let notes;
        if (isTop) {
          notes = await getTopMarginNotes(db, limit);
        } else {
          notes = await getAllMarginNotes(db, { search, bookTitle, sort });
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ notes }));
      } catch (err) {
        console.error("Error fetching margin notes:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Failed to fetch margin notes", details: err?.message }));
      }
      return true;
    }
    if (req.method === "POST") {
      try {
        const db = getPrisma();
        const body = await parseJsonBody(req);
        const { bookTitle, bookAuthor, passageSnippet, noteText, pageNumber, readerName, readerHandle, readerAvatar, userId } = body;
        if (!bookTitle?.trim() || !noteText?.trim()) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Book Volume and Reflection text are required." }));
          return true;
        }
        const rawSnippet = passageSnippet?.trim() || (noteText.trim().length > 60 ? noteText.trim().slice(0, 60) + "..." : noteText.trim());
        const cleanSnippet = rawSnippet.startsWith("\u201C") || rawSnippet.startsWith('"') ? rawSnippet : `\u201C${rawSnippet}\u201D`;
        const parsedPage = pageNumber ? parseInt(pageNumber, 10) : null;
        const validPage = parsedPage && !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : null;
        const newNote = await db.marginNote.create({
          data: {
            bookTitle: bookTitle.trim(),
            bookAuthor: bookAuthor?.trim() || null,
            passageSnippet: cleanSnippet,
            noteText: noteText.trim(),
            pageNumber: validPage,
            readerName: readerName?.trim() || "You (The Reader)",
            readerHandle: readerHandle?.trim() || "@you_in_the_margins",
            readerAvatar: readerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            userId: userId || null,
            likes: 1,
            timestamp: "Just now",
            isTopPick: true,
            comments: []
          }
        });
        invalidateTopNotesCache();
        if (userId) {
          try {
            await db.profile.updateMany({
              where: { OR: [{ id: userId }, { clerkId: userId }, { email: userId }] },
              data: { marginNotesCount: { increment: 1 } }
            });
          } catch (profileErr) {
            console.warn("[MarginNotes] Could not increment profile margin notes count:", profileErr);
          }
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: true, note: newNote }));
      } catch (err) {
        console.error("Error creating margin note:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err?.message || "Failed to create margin note", details: err?.message }));
      }
      return true;
    }
  }
  if (pathname === "/api/margin-notes/like" && req.method === "POST") {
    try {
      const db = getPrisma();
      const body = await parseJsonBody(req);
      const { noteId, liked } = body;
      if (!noteId) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing noteId" }));
        return true;
      }
      const updatedNote = await db.marginNote.update({
        where: { id: noteId },
        data: {
          likes: liked === false ? { decrement: 1 } : { increment: 1 }
        }
      });
      invalidateTopNotesCache();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, likes: updatedNote.likes, note: updatedNote }));
    } catch (err) {
      console.error("Error liking margin note:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to like note", details: err?.message }));
    }
    return true;
  }
  if (pathname === "/api/margin-notes/comment" && req.method === "POST") {
    try {
      const db = getPrisma();
      const body = await parseJsonBody(req);
      const { noteId, readerName, readerAvatar, text } = body;
      if (!noteId || !text?.trim()) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing noteId or comment text" }));
        return true;
      }
      const existingNote = await db.marginNote.findUnique({ where: { id: noteId } });
      if (!existingNote) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Note not found" }));
        return true;
      }
      const currentComments = Array.isArray(existingNote.comments) ? existingNote.comments : [];
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        readerName: readerName?.trim() || "Fellow Reader",
        readerAvatar: readerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        text: text.trim(),
        createdAt: "Just now"
      };
      currentComments.push(newComment);
      const updated = await db.marginNote.update({
        where: { id: noteId },
        data: { comments: currentComments }
      });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, note: updated, comments: currentComments }));
    } catch (err) {
      console.error("Error adding comment:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "Failed to add comment", details: err?.message }));
    }
    return true;
  }
  return false;
}

// src/server/vercelEntry.ts
async function handler(req, res) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Endpoint not found", url: req.url, query: req.query }));
    }
  } catch (err) {
    console.error("[VercelAPI] Unhandled error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "Internal server error", details: err?.message }));
  }
}
export {
  handler as default
};
