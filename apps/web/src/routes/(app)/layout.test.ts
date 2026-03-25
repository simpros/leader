import { describe, it, expect } from "bun:test";

/**
 * Structural regression tests for the app layout boundary.
 *
 * SvelteKit remote function queries using $derived(await query()) require
 * a <svelte:boundary> ancestor to handle pending and error states. Without
 * it, full-page reloads crash because there is no fallback for the async
 * pending state during hydration.
 *
 * These tests ensure the boundary is never accidentally removed.
 */
const layoutSource = await Bun.file(
  new URL("./+layout.svelte", import.meta.url),
).text();

describe("App layout boundary", () => {
  it("wraps page content in a svelte:boundary", () => {
    expect(layoutSource).toContain("<svelte:boundary>");
    expect(layoutSource).toContain("</svelte:boundary>");
  });

  it("has a pending snippet for loading state", () => {
    expect(layoutSource).toContain("{#snippet pending()}");
  });

  it("has a failed snippet for error recovery", () => {
    expect(layoutSource).toContain("{#snippet failed(error, reset)}");
  });

  it("provides a retry button in the failed state", () => {
    expect(layoutSource).toContain("Try again");
  });

  it("renders children inside the boundary, not outside", () => {
    const boundaryStart = layoutSource.indexOf("<svelte:boundary>");
    const boundaryEnd = layoutSource.indexOf("</svelte:boundary>");
    const childrenRender = layoutSource.indexOf("{@render children()}");

    expect(childrenRender).toBeGreaterThan(boundaryStart);
    expect(childrenRender).toBeLessThan(boundaryEnd);
  });
});
