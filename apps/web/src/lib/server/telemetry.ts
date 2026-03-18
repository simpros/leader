import { getOpenTelemetrySink } from "@logtape/otel";
import type { OpenTelemetrySink } from "@logtape/otel";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | null = null;
let loggerProvider: LoggerProvider | null = null;
let otelSink: OpenTelemetrySink | null = null;

/**
 * Initialise OpenTelemetry for traces and logs.
 *
 * Must be called from `src/instrumentation.server.ts` so the SDK is
 * ready before any application code runs.  After calling this,
 * retrieve the LogTape sink with {@link getOtelSink}.
 */
export function configureTelemetry(): void {
  if (process.env.LEADER_TELEMETRY === "false") {
    console.warn("[telemetry] Disabled: LEADER_TELEMETRY=false");
    return;
  }

  const endpoint = process.env.DYNATRACE_OTLP_ENDPOINT;
  const apiToken = process.env.DYNATRACE_API_TOKEN;

  if (!endpoint || !apiToken) {
    const reasons = [
      !endpoint && "DYNATRACE_OTLP_ENDPOINT not set",
      !apiToken && "DYNATRACE_API_TOKEN not set",
    ].filter(Boolean);
    console.warn(`[telemetry] Disabled: ${reasons.join(", ")}`);
    return;
  }

  const headers = { Authorization: `Api-Token ${apiToken}` };

  const resource = resourceFromAttributes({
    "service.name": "leader-web",
    "service.version": process.env.npm_package_version ?? "unknown",
  });

  // ── Traces ────────────────────────────────────────────────────────────
  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
    headers,
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [new HttpInstrumentation()],
  });
  sdk.start();

  // ── Logs ──────────────────────────────────────────────────────────────
  const logExporter = new OTLPLogExporter({
    url: `${endpoint}/v1/logs`,
    headers,
  });

  loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(logExporter)],
  });

  otelSink = getOpenTelemetrySink({ loggerProvider });

  console.log(
    "[telemetry] OpenTelemetry configured (traces + logs via OTLP)",
  );
}

/**
 * Return the LogTape sink that forwards log records via OTLP,
 * or `null` when telemetry is disabled / not configured.
 */
export function getOtelSink(): OpenTelemetrySink | null {
  return otelSink;
}

/**
 * Flush pending data and shut down all providers.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (otelSink) {
    await otelSink[Symbol.asyncDispose]();
    otelSink = null;
  }
  if (loggerProvider) {
    await loggerProvider.shutdown();
    loggerProvider = null;
  }
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
