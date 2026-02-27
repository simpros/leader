<script lang="ts">
  import { onMount } from "svelte";
  import { Debounced } from "runed";
  import type { Lead } from "$lib/leads/types";
  import { getProjectCustomFields } from "$lib/remote/projects.remote.js";
  import {
    highlightResolved,
    findMissingPlaceholders,
  } from "./template-variables.js";
  import TemplateVariableMenu from "./template-variable-menu.svelte";

  type EmailTemplateEditorProps = {
    value: string;
    name: string;
    placeholder?: string;
    subject?: string;
    subjectName?: string;
    projectId?: string;
    leads?: Lead[];
  };

  let {
    value = $bindable(""),
    name,
    placeholder,
    subject = $bindable(""),
    subjectName,
    projectId,
    leads = [],
  }: EmailTemplateEditorProps = $props();

  let viewMode = $state<"split" | "edit" | "preview">("split");
  let selectedLeadId = $state<string | null>(null);
  let menuOpen = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);
  let activeInputRef = $state<
    HTMLTextAreaElement | HTMLInputElement | null
  >(null);
  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let subjectInputRef = $state<HTMLInputElement | null>(null);

  const customFields = $derived(
    projectId ? await getProjectCustomFields(projectId) : []
  );

  const selectedLead = $derived(
    leads.find((l) => l.id === selectedLeadId) ?? null
  );

  const debouncedValue = new Debounced(() => value, 300);
  const debouncedSubject = new Debounced(() => subject, 300);

  const previewHtml = $derived.by(() => {
    const html = debouncedValue.current;
    if (!selectedLead) return html;
    const fields = customFields.map((f) => ({
      name: f.name,
      value: null,
    }));
    return highlightResolved(html, selectedLead, fields);
  });

  const missingPlaceholders = $derived.by(() => {
    const combined =
      (debouncedSubject.current ?? "") + " " + debouncedValue.current;
    return findMissingPlaceholders(combined, leads, customFields);
  });

  const toggleView = (mode: "split" | "edit" | "preview") => {
    viewMode = mode;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey &&
      event.key === "P"
    ) {
      event.preventDefault();
      toggleView(viewMode === "preview" ? "split" : "preview");
    }
  };

  function getCursorPixelPosition(
    el: HTMLTextAreaElement | HTMLInputElement
  ): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    const mirror = document.createElement("div");
    const style = window.getComputedStyle(el);

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.font = style.font;
    mirror.style.fontSize = style.fontSize;
    mirror.style.fontFamily = style.fontFamily;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.style.width = `${el.offsetWidth}px`;
    mirror.style.boxSizing = style.boxSizing;

    const selStart = el.selectionStart ?? 0;
    const textBefore = el.value.slice(0, selStart);

    mirror.textContent = textBefore;

    const cursor = document.createElement("span");
    cursor.textContent = "|";
    mirror.appendChild(cursor);

    document.body.appendChild(mirror);
    const cursorRect = cursor.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    document.body.removeChild(mirror);

    const scrollTop = el instanceof HTMLTextAreaElement ? el.scrollTop : 0;

    return {
      x: rect.left + (cursorRect.left - mirrorRect.left),
      y: rect.top + (cursorRect.top - mirrorRect.top) - scrollTop + 20,
    };
  }

  function checkForDoubleBrace(
    el: HTMLTextAreaElement | HTMLInputElement
  ): boolean {
    const pos = el.selectionStart ?? 0;
    return pos >= 2 && el.value.slice(pos - 2, pos) === "{{";
  }

  function handleInput(
    event: Event & {
      currentTarget: HTMLTextAreaElement | HTMLInputElement;
    }
  ) {
    const el = event.currentTarget;
    if (checkForDoubleBrace(el)) {
      const pos = getCursorPixelPosition(el);
      menuX = pos.x;
      menuY = pos.y;
      activeInputRef = el;
      menuOpen = true;
    }
  }

  function insertToken(token: string) {
    const el = activeInputRef;
    if (!el) {
      menuOpen = false;
      return;
    }

    const pos = el.selectionStart ?? 0;
    const before = el.value.slice(0, pos - 2);
    const after = el.value.slice(pos);
    const newValue = before + token + after;

    if (el === textareaRef) {
      value = newValue;
    } else if (el === subjectInputRef) {
      subject = newValue;
    } else {
      el.value = newValue;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const newPos = before.length + token.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });

    menuOpen = false;
  }

  function closeMenu() {
    menuOpen = false;
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<TemplateVariableMenu
  open={menuOpen}
  x={menuX}
  y={menuY}
  {customFields}
  onInsert={insertToken}
  onClose={closeMenu}
/>

<div class="flex flex-col gap-3">
  {#if subjectName !== undefined}
    <div class="flex flex-col gap-1.5">
      <span class="text-sm font-semibold text-neutral-700"
        >Email Subject</span
      >
      <input
        bind:this={subjectInputRef}
        bind:value={subject}
        name={subjectName}
        type="text"
        placeholder="e.g. Quick intro from Leader"
        oninput={handleInput}
        class="border-primary-200/70 focus-visible:border-primary-300 focus-visible:ring-primary-400/30 h-10 w-full rounded-xl border bg-white/90 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </div>
  {/if}

  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <div
        class="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1"
        role="toolbar"
        aria-label="View mode toolbar"
      >
        <button
          type="button"
          onclick={() => toggleView("edit")}
          class={[
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "edit"
              ? "bg-secondary-100 text-secondary-800"
              : "text-neutral-600 hover:bg-neutral-50",
          ]}
        >
          Edit
        </button>
        <button
          type="button"
          onclick={() => toggleView("split")}
          class={[
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "split"
              ? "bg-secondary-100 text-secondary-800"
              : "text-neutral-600 hover:bg-neutral-50",
          ]}
        >
          Split
        </button>
        <button
          type="button"
          onclick={() => toggleView("preview")}
          class={[
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "preview"
              ? "bg-secondary-100 text-secondary-800"
              : "text-neutral-600 hover:bg-neutral-50",
          ]}
        >
          Preview
        </button>
      </div>

      {#if leads.length > 0}
        <div class="flex items-center gap-1.5">
          <label
            for="preview-lead-select"
            class="text-xs font-medium text-neutral-500"
          >
            Preview as:
          </label>
          <select
            id="preview-lead-select"
            bind:value={selectedLeadId}
            class="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700 focus:ring-2 focus:ring-neutral-300 focus:ring-offset-1 focus:outline-none"
          >
            <option value={null}>— no lead —</option>
            {#each leads as lead (lead.placeId)}
              <option value={lead.id}>{lead.name}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>

    <div class="text-xs text-neutral-500">
      {value.length} characters
    </div>
  </div>

  <div
    class={[
      "grid gap-3",
      viewMode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
    ]}
  >
    {#if viewMode === "edit" || viewMode === "split"}
      <div class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-neutral-700">
          HTML Editor
        </span>
        <textarea
          bind:this={textareaRef}
          bind:value
          {name}
          {placeholder}
          oninput={handleInput}
          class="border-primary-200/70 focus-visible:border-primary-300 focus-visible:ring-primary-400/30 min-h-96 w-full rounded-xl border bg-white/90 px-3 py-2 font-mono text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        ></textarea>
      </div>
    {/if}

    {#if viewMode === "preview" || viewMode === "split"}
      <div class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-neutral-700">
          Email Preview
        </span>
        <div
          class="border-primary-200/70 min-h-96 w-full overflow-auto rounded-xl border bg-neutral-50 px-6 py-4"
        >
          <div class="mx-auto max-w-[600px]">
            {#if previewHtml.trim()}
              <!-- Intentional HTML rendering for email preview - content is user-controlled -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html previewHtml}
            {:else}
              <p class="text-sm text-neutral-400 italic">
                Preview will appear here as you type...
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if missingPlaceholders.length > 0}
    <div
      class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
    >
      <p class="text-sm font-medium text-amber-800">
        ⚠ Some placeholders have missing data
      </p>
      <ul class="mt-1 space-y-0.5">
        {#each missingPlaceholders as { token, missingCount } (token)}
          <li class="text-xs text-amber-700">
            <code class="rounded bg-amber-100 px-1 py-0.5 font-mono"
              >{token}</code
            >
            — empty for {missingCount} of {leads.length} lead{leads.length ===
            1
              ? ""
              : "s"}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <p class="text-xs text-neutral-400">
    Tip: type <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono"
      >&#123;&#123;</code
    > in the subject or body to insert a variable (e.g. lead name, address).
  </p>
</div>
