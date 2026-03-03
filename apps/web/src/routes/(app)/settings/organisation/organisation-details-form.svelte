<script lang="ts">
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import { updateOrganisationSchema } from "$lib/schemas/settings";
  import type { StatusMessage } from "./organisation.svelte.js";

  type OrganisationDetailsFormProps = {
    organization: { name: string; slug: string } | null;
  };

  let { organization }: OrganisationDetailsFormProps = $props();

  let orgName = $state(organization?.name ?? "");
  let orgSlug = $state(organization?.slug ?? "");
  let saving = $state(false);
  let message = $state<StatusMessage | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    message = null;

    const result = v.safeParse(updateOrganisationSchema, {
      name: orgName,
      slug: orgSlug,
    });
    if (!result.success) {
      message = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    saving = true;
    const { error } = await authClient.organization.update({
      data: {
        name: result.output.name,
        slug: result.output.slug,
      },
    });
    saving = false;

    if (error) {
      message = {
        type: "error",
        text: error.message ?? "Failed to update organisation",
      };
    } else {
      message = { type: "success", text: "Organisation updated" };
    }
  };
</script>

<Card variant="flat" class="p-6">
  <h2
    class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
  >
    Organisation Details
  </h2>
  <form class="flex flex-col gap-4" onsubmit={handleSubmit}>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold text-neutral-700" for="org-name"
        >Name</label
      >
      <Input id="org-name" bind:value={orgName} required />
    </div>
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold text-neutral-700" for="org-slug"
        >Slug</label
      >
      <Input id="org-slug" bind:value={orgSlug} required />
      <p class="text-xs text-neutral-400">
        Lowercase letters, numbers, and hyphens only.
      </p>
    </div>
    {#if message}
      <p
        class={[
          "border px-3 py-2 text-sm",
          message.type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-destructive-200 bg-destructive-50 text-destructive-700",
        ]}
      >
        {message.text}
      </p>
    {/if}
    <div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  </form>
</Card>
