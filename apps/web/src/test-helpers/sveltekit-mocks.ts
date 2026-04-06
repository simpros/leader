import { mock } from "bun:test";

export type QueryResult<T> = Promise<T> & {
  current: T;
  loading: boolean;
  error: null;
  refresh: () => Promise<T>;
  set: (value: T) => Promise<T>;
  withOverride: (override: (value: T) => T) => QueryResult<T>;
};

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
          issues: () => null,
        };
      },
    }
  );

  const addFormApi = <T extends (...args: unknown[]) => unknown>(
    target: T
  ) =>
    Object.assign(target, {
      for: () => addFormApi(mock(() => Promise.resolve(returnValue))),
      pending: 0,
      enhance: (cb?: (...args: unknown[]) => unknown) => ({
        action: "?/action",
        method: "POST",
        onsubmit: async (e: Event) => {
          e.preventDefault();
          if (cb) {
            const submit = () => {
              const result = target() as Promise<unknown>;
              return Object.assign(result, {
                updates: () => result,
              });
            };
            await cb({ submit });
          }
        },
      }),
      fields: fieldProxy,
    });

  return addFormApi(fn);
}

/**
 * Creates a mock for SvelteKit remote `query()` functions.
 */
export function createQueryMock<T>(returnValue: T) {
  return mock((): QueryResult<T> => createQueryResult(returnValue));
}

export function createQueryResult<T>(returnValue: T) {
  const result = Promise.resolve(returnValue) as QueryResult<T>;

  result.current = returnValue;
  result.loading = false;
  result.error = null;
  result.refresh = () => Promise.resolve(result.current);
  result.set = (value: T) => {
    result.current = value;
    return Promise.resolve(value);
  };
  result.withOverride = (override: (value: T) => T) =>
    createQueryResult(override(result.current));

  return result;
}

/**
 * Creates a mock for SvelteKit remote `command()` functions.
 */
export function createCommandMock(
  returnValue: unknown = { success: true }
) {
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
