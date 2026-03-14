<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import { signUpSchema } from "$lib/schemas/auth";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let orgName = $state("");
  let orgSlug = $state("");
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);

  const deriveSlug = () => {
    orgSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    errorMessage = null;

    const result = v.safeParse(signUpSchema, {
      name,
      email,
      password,
      confirmPassword,
      orgName,
      orgSlug,
    });

    if (!result.success) {
      errorMessage = result.issues[0]?.message ?? "Invalid input";
      return;
    }

    isSubmitting = true;

    const { error: signUpError } = await authClient.signUp.email({
      name: result.output.name,
      email: result.output.email,
      password: result.output.password,
    });

    if (signUpError) {
      isSubmitting = false;
      errorMessage = signUpError.message ?? "Failed to create account";
      return;
    }

    const { data: org, error: orgError } =
      await authClient.organization.create({
        name: result.output.orgName,
        slug: result.output.orgSlug,
      });

    if (orgError || !org) {
      isSubmitting = false;
      errorMessage =
        orgError?.message ?? "Account created but failed to create organisation";
      return;
    }

    await authClient.organization.setActive({
      organizationId: org.id,
    });

    isSubmitting = false;

    await goto("/");
  };
</script>

<main
  class="leader-page flex min-h-screen items-center justify-center py-10"
>
  <Card variant="flat" class="w-full max-w-md space-y-6 p-6 sm:p-8">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold text-neutral-900">
        Create an account
      </h1>
      <p class="leader-copy">
        Set up your account and organisation to start managing projects and
        leads.
      </p>
    </header>

    <form class="space-y-4" onsubmit={handleSubmit}>
      <div class="space-y-2">
        <label class="text-sm font-semibold text-neutral-700" for="name"
          >Name</label
        >
        <Input id="name" bind:value={name} required />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-neutral-700" for="email"
          >Email</label
        >
        <Input
          id="email"
          type="email"
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
          autocomplete="new-password"
          bind:value={password}
          required
        />
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="confirm-password">Confirm Password</label
        >
        <Input
          id="confirm-password"
          type="password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          required
        />
      </div>

      <hr class="border-neutral-200" />

      <div class="space-y-2">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="org-name">Organisation Name</label
        >
        <Input
          id="org-name"
          bind:value={orgName}
          oninput={deriveSlug}
          required
        />
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="org-slug">Organisation Slug</label
        >
        <Input id="org-slug" bind:value={orgSlug} required />
        <p class="text-xs text-neutral-400">
          Lowercase letters, numbers, and hyphens only.
        </p>
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
        {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>
    </form>

    <p class="text-center text-sm text-neutral-500">
      Already have an account?
      <a
        href="/auth/login"
        class="text-primary-600 hover:text-primary-700 font-semibold"
      >
        Sign in
      </a>
    </p>
  </Card>
</main>
