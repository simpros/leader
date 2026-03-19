import {
  describe,
  it,
  expect,
  mock,
  beforeAll,
  beforeEach,
  afterAll,
} from "bun:test";
import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import type { Span as ApiSpan } from "@opentelemetry/api";
import {
  NodeTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-node";
import type { Handle } from "@sveltejs/kit";

// ── mock $lib/server/telemetry ──────────────────────────────────────
// We provide a fake `getRootServerSpan` that returns a real OTel span
// created by the test tracer.  This simulates the promoted root span
// that the SvelteKitServerSpanProcessor would provide in production.

let fakeRootSpan: ApiSpan | undefined;

mock.module("$lib/server/telemetry", () => ({
  getRootServerSpan: () => fakeRootSpan,
}));

// ── OTel test provider ──────────────────────────────────────────────

const exporter = new InMemorySpanExporter();
const provider = new NodeTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

function getFinishedSpans(): ReadableSpan[] {
  return exporter.getFinishedSpans();
}

// ── fake SvelteKit errors (duck-typed) ──────────────────────────────

function fakeRedirect(status: number, location: string) {
  return Object.assign(new Error("redirect"), { status, location });
}

function fakeHttpError(status: number, message: string) {
  return Object.assign(new Error(message), {
    status,
    body: { message },
  });
}

// ── mock event builder ──────────────────────────────────────────────

interface MockEventOptions {
  method?: string;
  pathname?: string;
  search?: string;
  routeId?: string | null;
  userAgent?: string | null;
  port?: string;
}

function mockEvent(overrides: MockEventOptions = {}) {
  const {
    method = "GET",
    pathname = "/test",
    search = "",
    routeId = "/test",
    userAgent = "TestAgent/1.0",
    port = "",
  } = overrides;

  return {
    request: {
      method,
      headers: new Headers(userAgent ? { "user-agent": userAgent } : {}),
    },
    url: new URL(
      `https://localhost${port ? `:${port}` : ""}${pathname}${search}`,
    ),
    route: { id: routeId },
  };
}

// ── typed wrapper ───────────────────────────────────────────────────

type HandleInput = Parameters<Handle>[0];

function callHandle(
  event: ReturnType<typeof mockEvent>,
  resolve: () => Response | Promise<Response>,
) {
  return tracingHandle({
    event: event as unknown as HandleInput["event"],
    resolve: resolve as unknown as HandleInput["resolve"],
  });
}

// ── tests ────────────────────────────────────────────────────────────

let tracingHandle: Handle;
let tracer: ReturnType<typeof trace.getTracer>;

describe("tracingHandle", () => {
  beforeAll(async () => {
    provider.register();
    tracer = trace.getTracer("test");
    ({ tracingHandle } = await import("./tracing-handle"));
  });

  afterAll(async () => {
    await provider.shutdown();
    trace.disable();
  });

  beforeEach(() => {
    exporter.reset();
    // Create a fresh "root" span that simulates sveltekit.handle.root
    // after promotion by SvelteKitServerSpanProcessor.
    fakeRootSpan = tracer.startSpan("sveltekit.handle.root", {
      kind: SpanKind.SERVER,
    });
  });

  it("enriches the root span with HTTP attributes for a normal response", async () => {
    const response = await callHandle(
      mockEvent(),
      () => new Response("ok", { status: 200 }),
    );
    fakeRootSpan!.end();

    expect(response.status).toBe(200);

    const spans = getFinishedSpans();
    const root = spans.find((s) => s.name === "GET /test")!;
    expect(root).toBeDefined();
    expect(root.kind).toBe(SpanKind.SERVER);
    expect(root.attributes["http.request.method"]).toBe("GET");
    expect(root.attributes["url.path"]).toBe("/test");
    expect(root.attributes["url.scheme"]).toBe("https");
    expect(root.attributes["server.address"]).toBe("localhost");
    expect(root.attributes["http.route"]).toBe("/test");
    expect(root.attributes["user_agent.original"]).toBe("TestAgent/1.0");
    expect(root.attributes["http.response.status_code"]).toBe(200);
    expect(root.status.code).toBe(SpanStatusCode.UNSET);
  });

  it("marks the root span as ERROR for 5xx responses", async () => {
    await callHandle(mockEvent(), () => new Response("fail", { status: 503 }));
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(503);
    expect(root.status.code).toBe(SpanStatusCode.ERROR);
  });

  it("does not mark 4xx as ERROR", async () => {
    await callHandle(
      mockEvent(),
      () => new Response("not found", { status: 404 }),
    );
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(404);
    expect(root.status.code).toBe(SpanStatusCode.UNSET);
  });

  it("records redirect status code without marking ERROR", async () => {
    await expect(
      callHandle(mockEvent(), () => {
        throw fakeRedirect(303, "/other");
      }),
    ).rejects.toThrow();
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(303);
    expect(root.status.code).toBe(SpanStatusCode.UNSET);
  });

  it("records HttpError status and marks ERROR for 5xx", async () => {
    await expect(
      callHandle(mockEvent(), () => {
        throw fakeHttpError(502, "Bad Gateway");
      }),
    ).rejects.toThrow();
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(502);
    expect(root.status.code).toBe(SpanStatusCode.ERROR);
    expect(root.status.message).toBe("Bad Gateway");
  });

  it("records HttpError status without ERROR for 4xx", async () => {
    await expect(
      callHandle(mockEvent(), () => {
        throw fakeHttpError(403, "Forbidden");
      }),
    ).rejects.toThrow();
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(403);
    expect(root.status.code).toBe(SpanStatusCode.UNSET);
  });

  it("records status 500 and ERROR for unknown thrown errors", async () => {
    await expect(
      callHandle(mockEvent(), () => {
        throw new Error("unexpected");
      }),
    ).rejects.toThrow("unexpected");
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["http.response.status_code"]).toBe(500);
    expect(root.status.code).toBe(SpanStatusCode.ERROR);
    expect(root.status.message).toBe("unexpected");
  });

  it("uses pathname as span name when route id is null", async () => {
    await callHandle(
      mockEvent({ routeId: null, pathname: "/static/file.css" }),
      () => new Response("ok", { status: 200 }),
    );
    fakeRootSpan!.end();

    const root = getFinishedSpans().find(
      (s) => s.name === "GET /static/file.css",
    )!;
    expect(root).toBeDefined();
    expect(root.attributes["http.route"]).toBeUndefined();
  });

  it("sets server.port when present", async () => {
    await callHandle(
      mockEvent({ port: "3000" }),
      () => new Response("ok", { status: 200 }),
    );
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["server.port"]).toBe(3000);
  });

  it("does not set server.port when empty", async () => {
    await callHandle(mockEvent(), () => new Response("ok", { status: 200 }));
    fakeRootSpan!.end();

    const root = getFinishedSpans().find((s) => s.name === "GET /test")!;
    expect(root.attributes["server.port"]).toBeUndefined();
  });

  it("is a no-op when no root span is available", async () => {
    fakeRootSpan = undefined;

    const response = await callHandle(
      mockEvent(),
      () => new Response("ok", { status: 200 }),
    );

    expect(response.status).toBe(200);
    expect(getFinishedSpans()).toHaveLength(0);
  });
});
