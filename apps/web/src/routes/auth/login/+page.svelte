<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";

  let email = $state("");
  let password = $state("");
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);

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
      callbackURL: "/",
    });

    isSubmitting = false;

    if (error) {
      errorMessage = error.message ?? "Unable to sign in.";
      return;
    }

    await goto(resolve("/"));
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
  </Card>
</main>
