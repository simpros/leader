<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";

  let email = $state("");
  let password = $state("");
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);

  const redirectTo = page.url.searchParams.get("redirectTo") || "/";
  const allowSignUp = $derived(page.data.allowSignUp);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    errorMessage = null;
    isSubmitting = true;

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirectTo,
    });

    isSubmitting = false;

    if (error) {
      errorMessage = error.message ?? "Unable to sign in.";
      return;
    }

    // redirectTo is a dynamic query-string value, not a known route literal
    await goto(resolve(redirectTo as "/"));
  };
</script>

<main
  class="leader-page flex min-h-screen items-center justify-center py-10"
>
  <Card variant="flat" class="w-full max-w-md space-y-6 p-6 sm:p-8">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold text-neutral-900">Sign in</h1>
      <p class="leader-copy">
        Use your email and password to continue managing projects and
        leads.
      </p>
    </header>

    <form class="space-y-4" onsubmit={handleSubmit}>
      <div class="space-y-2">
        <label class="text-sm font-semibold text-neutral-700" for="email"
          >Email</label
        >
        <Input
          id="email"
          type="email"
          name="email"
          autocomplete="email"
          bind:value={email}
          required
        />
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="password">Password</label
        >
        <Input
          id="password"
          type="password"
          name="password"
          autocomplete="current-password"
          bind:value={password}
          required
        />
      </div>

      {#if errorMessage}
        <p
          class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-2xl border px-3 py-2 text-sm"
        >
          {errorMessage}
        </p>
      {/if}

      <Button
        class="w-full"
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>

    {#if allowSignUp}
      <p class="text-center text-sm text-neutral-500">
        Don't have an account?
        <a
          href={resolve("/auth/sign-up")}
          class="text-primary-600 hover:text-primary-700 font-semibold"
        >
          Create one
        </a>
      </p>
    {/if}
  </Card>
</main>
