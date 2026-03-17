import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";

const mockGoto = mock(() => Promise.resolve());
const mockResolve = mock((path: string) => path);
const mockSignUpEmail = mock(() =>
	Promise.resolve({ error: null as { message: string } | null })
);
const mockOrgCreate = mock(() =>
	Promise.resolve({
		data: { id: "org_1" } as { id: string } | null,
		error: null as { message: string } | null,
	})
);
const mockOrgSetActive = mock(() => Promise.resolve({}));

mock.module("$app/navigation", () => ({
  goto: mockGoto,
  invalidate: mock(() => Promise.resolve()),
  beforeNavigate: () => {},
  afterNavigate: () => {},
  onNavigate: () => {},
}));
mock.module("$app/paths", () => ({ resolve: mockResolve }));
mock.module("@leader/auth/client", () => ({
  authClient: {
    signUp: { email: mockSignUpEmail },
    organization: {
      create: mockOrgCreate,
      setActive: mockOrgSetActive,
    },
  },
}));

const { default: SignUpForm } = await import("./sign-up-form.svelte");

describe("SignUpForm", () => {
  beforeEach(() => {
    mockGoto.mockClear();
    mockSignUpEmail.mockClear();
    mockOrgCreate.mockClear();
    mockOrgSetActive.mockClear();
    mockSignUpEmail.mockImplementation(() =>
      Promise.resolve({ error: null })
    );
    mockOrgCreate.mockImplementation(() =>
      Promise.resolve({ data: { id: "org_1" }, error: null })
    );
    mockOrgSetActive.mockImplementation(() => Promise.resolve({}));
  });

  it("renders all form labels", () => {
    render(SignUpForm);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Password")).toBeTruthy();
    expect(screen.getByText("Confirm Password")).toBeTruthy();
    expect(screen.getByText("Organisation Name")).toBeTruthy();
    expect(screen.getByText("Organisation Slug")).toBeTruthy();
  });

  it("renders all form inputs", () => {
    render(SignUpForm);
    expect(document.getElementById("name")).toBeTruthy();
    expect(document.getElementById("email")).toBeTruthy();
    expect(document.getElementById("password")).toBeTruthy();
    expect(document.getElementById("confirm-password")).toBeTruthy();
    expect(document.getElementById("org-name")).toBeTruthy();
    expect(document.getElementById("org-slug")).toBeTruthy();
  });

  it("renders submit button with Create Account text", () => {
    render(SignUpForm);
    const btn = screen.getByRole("button", { name: "Create Account" });
    expect(btn).toBeTruthy();
  });

  it("renders slug hint text", () => {
    render(SignUpForm);
    expect(
      screen.getByText("Lowercase letters, numbers, and hyphens only.")
    ).toBeTruthy();
  });

  it("shows validation error for invalid input on submit", async () => {
    render(SignUpForm);

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      const errorEl = document.querySelector(".text-destructive-700");
      expect(errorEl).toBeTruthy();
    });
  });

  it("calls authClient.signUp.email on valid submit", async () => {
    render(SignUpForm);

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    const confirmInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;
    const orgNameInput = document.getElementById(
      "org-name"
    ) as HTMLInputElement;
    const orgSlugInput = document.getElementById(
      "org-slug"
    ) as HTMLInputElement;

    nameInput.value = "Test User";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    emailInput.value = "test@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.value = "password123";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    confirmInput.value = "password123";
    confirmInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgNameInput.value = "My Org";
    orgNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgSlugInput.value = "my-org";
    orgSlugInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("calls organization.create after successful sign up", async () => {
    render(SignUpForm);

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    const confirmInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;
    const orgNameInput = document.getElementById(
      "org-name"
    ) as HTMLInputElement;
    const orgSlugInput = document.getElementById(
      "org-slug"
    ) as HTMLInputElement;

    nameInput.value = "Test User";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    emailInput.value = "test@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.value = "password123";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    confirmInput.value = "password123";
    confirmInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgNameInput.value = "My Org";
    orgNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgSlugInput.value = "my-org";
    orgSlugInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(mockOrgCreate).toHaveBeenCalledWith({
        name: "My Org",
        slug: "my-org",
      });
    });
  });

  it("navigates to / after successful sign up and org creation", async () => {
    render(SignUpForm);

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    const confirmInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;
    const orgNameInput = document.getElementById(
      "org-name"
    ) as HTMLInputElement;
    const orgSlugInput = document.getElementById(
      "org-slug"
    ) as HTMLInputElement;

    nameInput.value = "Test User";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    emailInput.value = "test@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.value = "password123";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    confirmInput.value = "password123";
    confirmInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgNameInput.value = "My Org";
    orgNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgSlugInput.value = "my-org";
    orgSlugInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(mockGoto).toHaveBeenCalledWith("/");
    });
  });

  it("shows error when signUp fails", async () => {
    mockSignUpEmail.mockImplementation(() =>
      Promise.resolve({ error: { message: "Email already exists" } })
    );

    render(SignUpForm);

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    const confirmInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;
    const orgNameInput = document.getElementById(
      "org-name"
    ) as HTMLInputElement;
    const orgSlugInput = document.getElementById(
      "org-slug"
    ) as HTMLInputElement;

    nameInput.value = "Test User";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    emailInput.value = "test@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.value = "password123";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    confirmInput.value = "password123";
    confirmInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgNameInput.value = "My Org";
    orgNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgSlugInput.value = "my-org";
    orgSlugInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeTruthy();
    });
  });

  it("shows error when org creation fails", async () => {
    mockOrgCreate.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: { message: "Slug already taken" },
      })
    );

    render(SignUpForm);

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement;
    const confirmInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;
    const orgNameInput = document.getElementById(
      "org-name"
    ) as HTMLInputElement;
    const orgSlugInput = document.getElementById(
      "org-slug"
    ) as HTMLInputElement;

    nameInput.value = "Test User";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    emailInput.value = "test@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.value = "password123";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    confirmInput.value = "password123";
    confirmInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgNameInput.value = "My Org";
    orgNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    orgSlugInput.value = "my-org";
    orgSlugInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = document.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );

    await waitFor(() => {
      expect(screen.getByText("Slug already taken")).toBeTruthy();
    });
  });
});
