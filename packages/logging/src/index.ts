import { configure, getConsoleSink } from "@logtape/logtape";
import type { Sink } from "@logtape/logtape";
import { createDynatraceSink } from "./dynatrace-sink";

export { getLogger } from "@logtape/logtape";

let dynatraceDispose: (() => Promise<void>) | null = null;
let configured = false;

export async function configureLogging(): Promise<void> {
  if (configured) return;
  configured = true;
  const sinks: Record<string, Sink> = {
    console: getConsoleSink(),
  };
  const sinkNames: string[] = ["console"];

  const telemetryEnabled = process.env.LEADER_TELEMETRY !== "false";
  const dtUrl = process.env.DYNATRACE_LOG_INGEST_URL;
  const dtToken = process.env.DYNATRACE_API_TOKEN;

  if (telemetryEnabled && dtUrl && dtToken) {
    const dt = createDynatraceSink({ url: dtUrl, apiToken: dtToken });
    sinks.dynatrace = dt.sink;
    sinkNames.push("dynatrace");
    dynatraceDispose = dt.dispose;
    console.log("[logging] Dynatrace sink configured");
  } else {
    const reasons = [
      !telemetryEnabled && "LEADER_TELEMETRY=false",
      !dtUrl && "DYNATRACE_LOG_INGEST_URL not set",
      !dtToken && "DYNATRACE_API_TOKEN not set",
    ].filter(Boolean);
    console.warn(`[logging] Dynatrace sink disabled: ${reasons.join(", ")}`);
  }

  await configure({
    sinks,
    loggers: [
      { category: ["leader"], sinks: sinkNames, lowestLevel: "info" },
    ],
  });
}

export async function disposeLogging(): Promise<void> {
  if (dynatraceDispose) {
    await dynatraceDispose();
    dynatraceDispose = null;
  }
}
