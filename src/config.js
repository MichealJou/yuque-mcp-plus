const DEFAULT_API_BASE_URL = "https://www.yuque.com/api/v2";
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 3;

function readNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getConfig() {
  const token = process.env.YUQUE_TOKEN;

  return {
    token,
    apiBaseUrl: process.env.YUQUE_API_BASE_URL || DEFAULT_API_BASE_URL,
    timeoutMs: readNumberEnv("YUQUE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    retries: readNumberEnv("YUQUE_RETRIES", DEFAULT_RETRIES),
    defaultRepoId: process.env.YUQUE_DEFAULT_REPO_ID || "",
    defaultRepoNamespace: process.env.YUQUE_DEFAULT_REPO_NAMESPACE || ""
  };
}

export function validateConfig(config = getConfig()) {
  if (!config.token) {
    return {
      isValid: false,
      error: "Missing YUQUE_TOKEN"
    };
  }

  return { isValid: true };
}
