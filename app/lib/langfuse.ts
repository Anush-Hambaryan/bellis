import { LangfuseClient } from "@langfuse/client";
import { LangfuseSpanProcessor } from "@langfuse/otel";

const globalForLangfuse = globalThis as typeof globalThis & {
  __langfuseClient?: LangfuseClient;
  __langfuseSpanProcessor?: LangfuseSpanProcessor;
};

export function getLangfuseConfig() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const host =
    process.env.LANGFUSE_BASE_URL ??
    process.env.LANGFUSE_HOST ??
    "https://cloud.langfuse.com";

  return {
    publicKey,
    secretKey,
    host: host.replace(/\/$/, ""),
  };
}

export function hasLangfuseCredentials(
  config = getLangfuseConfig(),
) {
  return Boolean(config.publicKey && config.secretKey);
}

export function getLangfuseAuthHeader(
  config = getLangfuseConfig(),
) {
  if (!config.publicKey || !config.secretKey) return null;

  return `Basic ${Buffer.from(
    `${config.publicKey}:${config.secretKey}`,
  ).toString("base64")}`;
}

export function getLangfuseClient() {
  globalForLangfuse.__langfuseClient ??= new LangfuseClient({
    baseUrl: getLangfuseConfig().host,
  });

  return globalForLangfuse.__langfuseClient;
}

export const langfuseSpanProcessor =
  globalForLangfuse.__langfuseSpanProcessor ??=
    new LangfuseSpanProcessor({ exportMode: "immediate" });
