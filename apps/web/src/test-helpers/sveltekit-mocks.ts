import { mock } from "bun:test";

/**
 * Creates a mock for SvelteKit remote `form()` functions.
 * Simulates .for(), .enhance(), .pending, and .fields properties.
 */
export function createFormMock(returnValue: unknown = { error: null }) {
  const fn = mock(() => Promise.resolve(returnValue));

  const fieldProxy = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "set") return () => {};
        return {
          as: () => ({ name: "field", value: "" }),
        };
      },
    },
  );

  const enhanceFn = () => ({
    action: "?/action",
    method: "POST",
  });

  const addFormApi = (target: (...args: unknown[]) => unknown) =>
    Object.assign(target, {
      for: () => addFormApi(mock(() => Promise.resolve(returnValue))),
      pending: 0,
      enhance: enhanceFn,
      fields: fieldProxy,
    });

  return addFormApi(fn);
}

/**
 * Creates a mock for SvelteKit remote `query()` functions.
 */
export function createQueryMock(returnValue: unknown = []) {
  return mock(() => Promise.resolve(returnValue));
}

/**
 * Creates a mock for SvelteKit remote `command()` functions.
 */
export function createCommandMock(returnValue: unknown = { success: true }) {
  return mock(() => Promise.resolve(returnValue));
}

/**
 * Registers common $app/* module mocks.
 */
export function mockSvelteKitModules() {
  const mockGoto = mock(() => Promise.resolve());
  const mockInvalidate = mock(() => Promise.resolve());
  const mockResolve = mock((path: string) => path);

  mock.module("$app/navigation", () => ({
    goto: mockGoto,
    invalidate: mockInvalidate,
  }));

  mock.module("$app/paths", () => ({
    resolve: mockResolve,
  }));

  mock.module("$app/state", () => ({
    page: {
      url: new URL("http://localhost:5173/test"),
      params: {},
    },
  }));

  mock.module("$app/server", () => ({
    query: (fn: (...args: unknown[]) => unknown) => fn,
    form: () => createFormMock(),
    command: () => createCommandMock(),
    getRequestEvent: () => ({}),
  }));

  return { mockGoto, mockInvalidate, mockResolve };
}
