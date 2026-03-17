<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { authClient } from "@leader/auth/client";
  import { Button, Card } from "@leader/ui";
  import AcceptInvitationRegisterForm from "./accept-invitation-register-form.svelte";

  let { data } = $props();

  let accepting = $state(false);
  let declining = $state(false);
  let errorMessage = $state<string | null>(null);

  const invitation = $derived(data.invitation);
  const user = $derived(data.user);
  const isExpired = $derived(new Date(invitation.expiresAt) < new Date());
  const isUsable = $derived(invitation.status === "pending" && !isExpired);

  const handleAccept = async () => {
    accepting = true;
    errorMessage = null;

    const { error } = await authClient.organization.acceptInvitation({
      invitationId: invitation.id,
    });
    accepting = false;

    if (error) {
      errorMessage = error.message ?? "Failed to accept invitation";
      return;
    }

    await goto(resolve("/"));
  };

  const handleDecline = async () => {
    declining = true;
    errorMessage = null;

    const { error } = await authClient.organization.rejectInvitation({
      invitationId: invitation.id,
    });
    declining = false;

    if (error) {
      errorMessage = error.message ?? "Failed to decline invitation";
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
      <h1 class="text-2xl font-semibold text-neutral-900">
        Organisation Invitation
      </h1>
      {#if isUsable}
        <p class="text-sm text-neutral-600">
          You've been invited to join
          <span class="font-semibold text-neutral-900"
            >{invitation.organizationName}</span
          >
          as
          <span class="font-mono text-xs font-bold uppercase"
            >{invitation.role ?? "member"}</span
          >.
        </p>
      {:else if invitation.status !== "pending"}
        <p class="text-sm text-neutral-600">
          This invitation has already been {invitation.status}.
        </p>
      {:else}
        <p class="text-sm text-neutral-600">This invitation has expired.</p>
      {/if}
    </header>

    {#if isUsable}
      {#if user}
        {#if errorMessage}
          <p
            class="border-destructive-200 bg-destructive-50 text-destructive-700 border px-3 py-2 text-sm"
          >
            {errorMessage}
          </p>
        {/if}
        <div class="flex gap-3">
          <Button
            class="flex-1"
            onclick={handleAccept}
            disabled={accepting || declining}
          >
            {accepting ? "Accepting…" : "Accept"}
          </Button>
          <Button
            class="flex-1"
            variant="ghost"
            color="destructive"
            onclick={handleDecline}
            disabled={accepting || declining}
          >
            {declining ? "Declining…" : "Decline"}
          </Button>
        </div>
      {:else}
        <p class="text-sm text-neutral-600">
          Create an account to get started.
        </p>
        <AcceptInvitationRegisterForm
          invitationId={invitation.id}
          email={invitation.email}
        />
        <p class="text-center text-sm text-neutral-500">
          Already have an account?
          <a
            href="{resolve(
              '/auth/login'
            )}?redirectTo=/accept-invitation/{invitation.id}"
            class="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Sign in
          </a>
        </p>
      {/if}
    {:else}
      <Button class="w-full" onclick={() => goto(resolve("/"))}>
        Go to Dashboard
      </Button>
    {/if}
  </Card>
</main>
