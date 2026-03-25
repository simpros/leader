import { describe, it, expect } from "bun:test";

/**
 * Structural guard tests for the app layout error boundary.
 *
 * The (app) layout wraps all page content in a <svelte:boundary> so that
 * async `$derived(await query())` calls have proper pending/error fallbacks.
 * Without the boundary, navigation to a page with an async load can crash
 * because there is no ancestor to handle the pending or error state.
 *
 * These tests read the raw source to verify the boundary is present.
 * This approach is intentional: the boundary is an architectural requirement
 * that is difficult to exercise through component rendering alone, and
 * removing it would silently break the app at runtime.
 */
const layoutSource = await Bun.file(
  new URL("./+layout.svelte", import.meta.url)
).text();

describe("App layout boundary (structural guard)", () => {
  it("contains a svelte:boundary element", () => {
    expect(layoutSource).toMatch(/<svelte:boundary>/);
    expect(layoutSource).toMatch(/<\/svelte:boundary>/);
  });

  it("provides a pending snippet for loading state", () => {
    expect(layoutSource).toMatch(/\{#snippet pending\b/);
  });

  it("provides a failed snippet for error recovery", () => {
    expect(layoutSource).toMatch(/\{#snippet failed\b/);
  });

  it("renders children inside the boundary", () => {
    const boundaryStart = layoutSource.indexOf("<svelte:boundary>");
    const boundaryEnd = layoutSource.indexOf("</svelte:boundary>");
    const childrenRender = layoutSource.indexOf("{@render children()}");

    expect(childrenRender).toBeGreaterThan(boundaryStart);
    expect(childrenRender).toBeLessThan(boundaryEnd);
  });
});
