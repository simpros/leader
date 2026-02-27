<script lang="ts">
  import { page } from "$app/state";
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import {
    updateProfileSchema,
    changePasswordSchema,
  } from "$lib/schemas/settings";

  let name = $state(page.data.user?.name ?? "");
  let profileSaving = $state(false);
  let profileMessage = $state<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let passwordSaving = $state(false);
  let passwordMessage = $state<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleProfileSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    profileMessage = null;

    const result = v.safeParse(updateProfileSchema, { name });
    if (!result.success) {
      profileMessage = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    profileSaving = true;
    const { error } = await authClient.updateUser({
      name: result.output.name,
    });
    profileSaving = false;

    if (error) {
      profileMessage = {
        type: "error",
        text: error.message ?? "Failed to update profile",
      };
    } else {
      profileMessage = { type: "success", text: "Profile updated" };
    }
  };

  const handlePasswordSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    passwordMessage = null;

    const result = v.safeParse(changePasswordSchema, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      passwordMessage = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    passwordSaving = true;
    const { error } = await authClient.changePassword({
      currentPassword: result.output.currentPassword,
      newPassword: result.output.newPassword,
      revokeOtherSessions: false,
    });
    passwordSaving = false;

    if (error) {
      passwordMessage = {
        type: "error",
        text: error.message ?? "Failed to change password",
      };
    } else {
      passwordMessage = { type: "success", text: "Password changed" };
      currentPassword = "";
      newPassword = "";
      confirmPassword = "";
    }
  };
</script>

<div class="flex flex-col gap-8">
  <Card variant="flat" class="p-6">
    <h2
      class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
    >
      Profile
    </h2>
    <form class="flex flex-col gap-4" onsubmit={handleProfileSubmit}>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="profile-name">Name</label
        >
        <Input id="profile-name" bind:value={name} required />
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="profile-email">Email</label
        >
        <Input
          id="profile-email"
          value={page.data.user?.email ?? ""}
          disabled
        />
        <p class="text-xs text-neutral-400">
          Email cannot be changed here.
        </p>
      </div>
      {#if profileMessage}
        <p
          class={[
            "border px-3 py-2 text-sm",
            profileMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-destructive-200 bg-destructive-50 text-destructive-700",
          ]}
        >
          {profileMessage.text}
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={profileSaving}>
          {profileSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  </Card>

  <Card variant="flat" class="p-6">
    <h2
      class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
    >
      Change Password
    </h2>
    <form class="flex flex-col gap-4" onsubmit={handlePasswordSubmit}>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="current-password">Current Password</label
        >
        <Input
          id="current-password"
          type="password"
          autocomplete="current-password"
          bind:value={currentPassword}
          required
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="new-password">New Password</label
        >
        <Input
          id="new-password"
          type="password"
          autocomplete="new-password"
          bind:value={newPassword}
          required
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="confirm-password">Confirm New Password</label
        >
        <Input
          id="confirm-password"
          type="password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          required
        />
      </div>
      {#if passwordMessage}
        <p
          class={[
            "border px-3 py-2 text-sm",
            passwordMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-destructive-200 bg-destructive-50 text-destructive-700",
          ]}
        >
          {passwordMessage.text}
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={passwordSaving}>
          {passwordSaving ? "Changing…" : "Change Password"}
        </Button>
      </div>
    </form>
  </Card>
</div>
