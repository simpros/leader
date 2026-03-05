import { configure, getConsoleSink } from "@logtape/logtape";
import type { Sink } from "@logtape/logtape";

export { getLogger } from "@logtape/logtape";

let configured = false;

interface LoggingOptions {
  /** Additional sinks to register alongside the console sink. */
  sinks?: Record<string, Sink>;
}

export async function configureLogging(options?: LoggingOptions): Promise<void> {
  if (configured) return;
  configured = true;

  const sinks: Record<string, Sink> = {
    console: getConsoleSink(),
    ...options?.sinks,
  };

  await configure({
    sinks,
    loggers: [
      { category: ["leader"], sinks: Object.keys(sinks), lowestLevel: "info" },
    ],
  });
}
