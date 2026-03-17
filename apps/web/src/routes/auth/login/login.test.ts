import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen } from "@testing-library/svelte";

const mockGoto = mock(() => Promise.resolve());
const mockResolve = mock((path: string) => path);
const mockSignIn = mock(() => Promise.resolve({ error: null }));

mock.module("$app/navigation", () => ({
  goto: mockGoto,
  invalidate: mock(() => Promise.resolve()),
  beforeNavigate: () => {},
  afterNavigate: () => {},
  onNavigate: () => {},
}));
mock.module("$app/paths", () => ({ resolve: mockResolve }));
mock.module("$app/state", () => ({
	page: {
		url: new URL("http://localhost/auth/login"),
		data: { allowSignUp: false },
	},
}));
mock.module("@leader/auth/client", () => ({
  authClient: {
    signIn: {
      email: mockSignIn,
    },
  },
}));

const { default: LoginPage } = await import("./+page.svelte");

describe("Login page", () => {
  beforeEach(() => {
    mockGoto.mockClear();
    mockSignIn.mockClear();
    mockSignIn.mockImplementation(() => Promise.resolve({ error: null }));
  });

  it("renders the sign in heading", () => {
    render(LoginPage);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();
  });

  it("renders email and password inputs", () => {
    render(LoginPage);
    expect(document.getElementById("email")).toBeTruthy();
    expect(document.getElementById("password")).toBeTruthy();
  });

  it("renders submit button with Sign in text", () => {
    render(LoginPage);
    const btn = screen.getByRole("button", { name: "Sign in" });
    expect(btn).toBeTruthy();
  });

  it("renders email label", () => {
    render(LoginPage);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("renders password label", () => {
    render(LoginPage);
    expect(screen.getByText("Password")).toBeTruthy();
  });
});
