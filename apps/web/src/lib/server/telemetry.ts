import { getOpenTelemetrySink } from "@logtape/otel";
import type { OpenTelemetrySink } from "@logtape/otel";
import { SpanKind, trace } from "@opentelemetry/api";
import type { Span as ApiSpan } from "@opentelemetry/api";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import type { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-node";

let sdk: NodeSDK | null = null;
let loggerProvider: LoggerProvider | null = null;
let otelSink: OpenTelemetrySink | null = null;

// ── SvelteKit root-span promotion ───────────────────────────────────
// SvelteKit's built-in tracing creates `sveltekit.handle.root` as
// SpanKind.INTERNAL.  Dynatrace (and most APM backends) require a
// SpanKind.SERVER entry-point span to detect and link services.
//
// This processor intercepts root spans on start and overwrites their
// kind to SERVER.  The handle hook (`tracingHandle`) later enriches
// the same span with HTTP semantic-convention attributes.

const rootSpansByTrace = new Map<string, ApiSpan>();

const svelteKitServerSpanProcessor: SpanProcessor = {
  onStart(span) {
    const name = (span as unknown as ReadableSpan).name;
    if (name === "sveltekit.handle.root") {
      // `kind` is declared `readonly` in TS but is a plain JS property.
      Object.defineProperty(span, "kind", {
        value: SpanKind.SERVER,
        writable: true,
        configurable: true,
      });
      rootSpansByTrace.set(span.spanContext().traceId, span);
    }
  },
  onEnd(span) {
    if (span.name === "sveltekit.handle.root") {
      rootSpansByTrace.delete(span.spanContext().traceId);
    }
  },
  async shutdown() {
    rootSpansByTrace.clear();
  },
  async forceFlush() {},
};

/**
 * Return the promoted root SERVER span for the current trace, or
 * `undefined` when telemetry is disabled or the span is unavailable.
 */
export function getRootServerSpan(): ApiSpan | undefined {
  const active = trace.getActiveSpan();
  if (!active) return undefined;
  return rootSpansByTrace.get(active.spanContext().traceId);
}

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
    spanProcessors: [
      svelteKitServerSpanProcessor,
      new BatchSpanProcessor(traceExporter),
    ],
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
