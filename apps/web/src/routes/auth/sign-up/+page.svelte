<script lang="ts">
  import { resolve } from "$app/paths";
  import { Card } from "@leader/ui";
  import SignUpForm from "./sign-up-form.svelte";
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

    <SignUpForm />

    <p class="text-center text-sm text-neutral-500">
      Already have an account?
      <a
        href={resolve("/auth/login")}
        class="text-primary-600 hover:text-primary-700 font-semibold"
      >
        Sign in
      </a>
    </p>
  </Card>
</main>
