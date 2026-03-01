import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LogRecord } from "@logtape/logtape";
import { createDynatraceSink } from "./dynatrace-sink";

function makeLogRecord(overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    level: "info",
    category: ["leader", "test"],
    message: ["test message"],
    timestamp: Date.now(),
    properties: {},
    rawMessage: "test message",
    ...overrides,
  } as LogRecord;
}

describe("createDynatraceSink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates a sink and dispose function", () => {
    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test-token",
    });
    expect(typeof sink).toBe("function");
    expect(typeof dispose).toBe("function");
    dispose();
  });

  it("buffers records without immediately flushing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test-token",
      batchSize: 10,
    });

    sink(makeLogRecord());

    // No fetch yet - still buffered
    expect(fetchSpy).not.toHaveBeenCalled();

    await dispose();
  });

  it("flushes when batch size is reached", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test-token",
      batchSize: 3,
      flushIntervalMs: 60_000,
    });

    sink(makeLogRecord({ message: ["msg1"] }));
    sink(makeLogRecord({ message: ["msg2"] }));
    sink(makeLogRecord({ message: ["msg3"] }));

    // Batch size reached, flush should be scheduled
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body).toHaveLength(3);
    expect(body[0].content).toBe("msg1");

    await dispose();
  });

  it("flushes on interval", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test-token",
      batchSize: 100,
      flushIntervalMs: 5_000,
    });

    sink(makeLogRecord({ message: ["interval msg"] }));

    await vi.advanceTimersByTimeAsync(5_000);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await dispose();
  });

  it("sends correct headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://dt.example.com/log",
      apiToken: "my-api-token",
      batchSize: 1,
    });

    sink(makeLogRecord());
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchSpy).toHaveBeenCalledWith("https://dt.example.com/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: "Api-Token my-api-token",
      },
      body: expect.any(String),
    });

    await dispose();
  });

  it("maps log record fields correctly", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test",
      batchSize: 1,
    });

    sink(
      makeLogRecord({
        level: "error",
        category: ["leader", "auth"],
        message: ["login failed"],
        properties: { userId: "u1", count: 42 },
      })
    );

    await vi.advanceTimersByTimeAsync(0);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body[0]).toMatchObject({
      content: "login failed",
      "log.source": "leader.auth",
      severity: "ERROR",
      userId: "u1",
      count: 42,
    });
    expect(body[0].timestamp).toBeDefined();

    await dispose();
  });

  it("handles fetch errors without throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test",
      batchSize: 1,
    });

    sink(makeLogRecord());

    // Should not throw
    await vi.advanceTimersByTimeAsync(0);

    await dispose();
    consoleSpy.mockRestore();
  });

  it("warns on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500, statusText: "Internal Server Error" })
    );
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test",
      batchSize: 1,
    });

    sink(makeLogRecord());
    await vi.advanceTimersByTimeAsync(0);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("500")
    );

    await dispose();
    consoleSpy.mockRestore();
  });

  it("flushes remaining records on dispose", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test",
      batchSize: 100,
      flushIntervalMs: 60_000,
    });

    sink(makeLogRecord({ message: ["flush on dispose"] }));

    vi.useRealTimers();
    await dispose();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body[0].content).toBe("flush on dispose");
  });

  it("maps severity levels correctly", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const { sink, dispose } = createDynatraceSink({
      url: "https://example.com/log",
      apiToken: "test",
      batchSize: 1,
    });

    const levels = ["trace", "debug", "info", "warning", "error", "fatal"] as const;
    const expected = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

    for (let i = 0; i < levels.length; i++) {
      fetchSpy.mockClear();
      sink(makeLogRecord({ level: levels[i] }));
      await vi.advanceTimersByTimeAsync(0);

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
      expect(body[0].severity).toBe(expected[i]);
    }

    await dispose();
  });
});
