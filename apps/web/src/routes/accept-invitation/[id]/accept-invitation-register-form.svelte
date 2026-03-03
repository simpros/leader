<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { authClient } from "@leader/auth/client";
  import { Button, Input } from "@leader/ui";
  import * as v from "valibot";
  import { registerSchema } from "$lib/schemas/auth";

  type AcceptInvitationRegisterFormProps = {
    invitationId: string;
    email: string;
  };

  let { invitationId, email }: AcceptInvitationRegisterFormProps = $props();

  let name = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let saving = $state(false);
  let errorMessage = $state<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    errorMessage = null;

    const result = v.safeParse(registerSchema, {
      name,
      password,
      confirmPassword,
    });
    if (!result.success) {
      errorMessage = result.issues[0]?.message ?? "Invalid input";
      return;
    }

    saving = true;

    const { error: signUpError } = await authClient.signUp.email({
      name: result.output.name,
      email,
      password: result.output.password,
    });

    if (signUpError) {
      saving = false;
      errorMessage = signUpError.message ?? "Failed to create account";
      return;
    }

    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      });

    saving = false;

    if (acceptError) {
      errorMessage = acceptError.message ?? "Failed to accept invitation";
      return;
    }

    await goto(resolve("/"));
  };
</script>

<form class="space-y-4" onsubmit={handleSubmit}>
  <div class="space-y-2">
    <label class="text-sm font-semibold text-neutral-700" for="reg-name"
      >Name</label
    >
    <Input id="reg-name" bind:value={name} required />
  </div>
  <div class="space-y-2">
    <label class="text-sm font-semibold text-neutral-700" for="reg-email"
      >Email</label
    >
    <Input id="reg-email" type="email" value={email} disabled />
  </div>
  <div class="space-y-2">
    <label
      class="text-sm font-semibold text-neutral-700"
      for="reg-password">Password</label
    >
    <Input
      id="reg-password"
      type="password"
      autocomplete="new-password"
      bind:value={password}
      required
    />
  </div>
  <div class="space-y-2">
    <label
      class="text-sm font-semibold text-neutral-700"
      for="reg-confirm-password">Confirm Password</label
    >
    <Input
      id="reg-confirm-password"
      type="password"
      autocomplete="new-password"
      bind:value={confirmPassword}
      required
    />
  </div>

  {#if errorMessage}
    <p
      class="border-destructive-200 bg-destructive-50 text-destructive-700 border px-3 py-2 text-sm"
    >
      {errorMessage}
    </p>
  {/if}

  <Button
    class="w-full"
    type="submit"
    disabled={saving}
    aria-busy={saving}
  >
    {saving ? "Creating account…" : "Create Account & Join"}
  </Button>
</form>
