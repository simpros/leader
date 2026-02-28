import type { LogRecord, Sink } from "@logtape/logtape";

const SEVERITY_MAP: Record<string, string> = {
  trace: "TRACE",
  debug: "DEBUG",
  info: "INFO",
  warning: "WARN",
  error: "ERROR",
  fatal: "FATAL",
};

function renderMessage(message: readonly unknown[]): string {
  return message
    .map((part) => {
      if (typeof part === "string") return part;
      try {
        return JSON.stringify(part);
      } catch {
        return String(part);
      }
    })
    .join("");
}

function toAttribute(value: unknown): string | number | boolean {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapRecord(
  record: LogRecord
): Record<string, string | number | boolean> {
  const entry: Record<string, string | number | boolean> = {
    content: renderMessage(record.message),
    "log.source": record.category.join("."),
    severity: SEVERITY_MAP[record.level] ?? "INFO",
    timestamp: new Date(record.timestamp).toISOString(),
  };

  for (const [key, value] of Object.entries(record.properties)) {
    entry[key] = toAttribute(value);
  }

  return entry;
}

interface DynatraceSinkOptions {
  url: string;
  apiToken: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

export function createDynatraceSink(options: DynatraceSinkOptions): {
  sink: Sink;
  dispose: () => Promise<void>;
} {
  const {
    url,
    apiToken,
    batchSize = 100,
    flushIntervalMs = 5_000,
  } = options;

  const buffer: Record<string, string | number | boolean>[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let flushPromise: Promise<void> = Promise.resolve();

  const flush = async () => {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Api-Token ${apiToken}`,
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.warn(
          `[dynatrace-sink] Log ingestion failed: ${res.status} ${res.statusText}`
        );
      }
    } catch {
      // Logging failures must not crash the application
    }
  };

  const scheduleFlush = () => {
    flushPromise = flushPromise.then(flush);
  };

  flushTimer = setInterval(scheduleFlush, flushIntervalMs);
  // Prevent the timer from keeping the process alive
  if (flushTimer && typeof flushTimer === "object" && "unref" in flushTimer) {
    flushTimer.unref();
  }

  const sink: Sink = (record: LogRecord) => {
    buffer.push(mapRecord(record));
    if (buffer.length >= batchSize) {
      scheduleFlush();
    }
  };

  const dispose = async () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    await flushPromise;
    await flush();
  };

  return { sink, dispose };
}
