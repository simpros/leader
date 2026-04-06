import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  createCommandMock,
  createFormMock,
} from "../../test-helpers/sveltekit-mocks";

// Mock $app/server before importing the module under test
const mockWideEvent: Record<string, unknown> = {};
const mockGetRequestEvent = mock(() => ({
  locals: { wideEvent: mockWideEvent },
}));

mock.module("$app/server", () => ({
  query: (fn: (...args: unknown[]) => unknown) => fn,
  form: () => createFormMock(),
  command: () => createCommandMock(),
  getRequestEvent: mockGetRequestEvent,
}));

const { addRequestLogContext } = await import("./request-logging");

describe("addRequestLogContext", () => {
  beforeEach(() => {
    // Clear the mock wide event
    for (const key of Object.keys(mockWideEvent)) {
      delete mockWideEvent[key];
    }
    mockGetRequestEvent.mockClear();
  });

  it("merges context into wideEvent", () => {
    addRequestLogContext({ action: "create", entityId: "123" });

    expect(mockWideEvent).toEqual({ action: "create", entityId: "123" });
  });

  it("calls getRequestEvent", () => {
    addRequestLogContext({ test: true });

    expect(mockGetRequestEvent).toHaveBeenCalledTimes(1);
  });

  it("merges multiple calls additively", () => {
    addRequestLogContext({ a: 1 });
    addRequestLogContext({ b: 2 });

    expect(mockWideEvent).toEqual({ a: 1, b: 2 });
  });

  it("overwrites existing keys", () => {
    addRequestLogContext({ key: "old" });
    addRequestLogContext({ key: "new" });

    expect(mockWideEvent).toEqual({ key: "new" });
  });

  it("handles empty context object", () => {
    addRequestLogContext({});

    expect(mockWideEvent).toEqual({});
  });
});
