<script lang="ts">
  import { Debounced } from "runed";
  import { untrack } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";
  import Link from "@tiptap/extension-link";
  import TextAlign from "@tiptap/extension-text-align";
  import Placeholder from "@tiptap/extension-placeholder";
  import type { Lead } from "$lib/leads/types";
  import {
    findMissingPlaceholders,
    getAllTemplateVariables,
    getTemplateVariablePreview,
  } from "./template-variables.js";
  import {
    normalizeTemplateEditorHtml,
    preprocessTemplateHtml,
    postprocessTemplateHtml,
  } from "./editor/tiptap-template-variable.js";
  import { EmailButton } from "./editor/tiptap-email-button.js";
  import { createVariableSuggestion } from "./editor/tiptap-variable-suggestion.js";
  import type {
    SuggestionCallbackProps,
    SuggestionItem,
  } from "./editor/tiptap-variable-suggestion.js";
  import EditorToolbar from "./editor/editor-toolbar.svelte";
  import EditorVariablePopup from "./editor/editor-variable-popup.svelte";
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

  let editorElement = $state<HTMLDivElement | null>(null);
  let editor = $state<Editor | null>(null);
  let editorVersion = $state(0);
  let selectedPreviewLeadId = $state("");
  let subjectInputRef = $state<HTMLInputElement | null>(null);

  // Subject input variable menu state
  let subjectMenuOpen = $state(false);
  let subjectMenuX = $state(0);
  let subjectMenuY = $state(0);

  // Suggestion popup state
  let suggestionOpen = $state(false);
  let suggestionItems = $state<SuggestionItem[]>([]);
  let suggestionCommand = $state<((item: SuggestionItem) => void) | null>(
    null
  );
  let suggestionClientRect = $state<(() => DOMRect | null) | null>(null);
  let variablePopupRef = $state<EditorVariablePopup | null>(null);

  // Prevent feedback loops when setting editor content externally
  let isUpdatingFromEditor = false;

  async function loadProjectCustomFields(projectId: string) {
    const { getProjectCustomFields } =
      await import("$lib/remote/projects.remote.js");

    return getProjectCustomFields(projectId);
  }

  const customFields = $derived(
    projectId ? await loadProjectCustomFields(projectId) : []
  );

  const allVariables = $derived(getAllTemplateVariables(customFields));
  const previewableLeads = $derived(
    leads.filter((lead): lead is Lead & { id: string } => Boolean(lead.id))
  );

  const debouncedValue = new Debounced(() => value, 300);
  const debouncedSubject = new Debounced(() => subject, 300);

  const selectedPreviewLead = $derived(
    previewableLeads.find((lead) => lead.id === selectedPreviewLeadId) ??
      null
  );

  const missingPlaceholders = $derived.by(() => {
    const combined =
      (debouncedSubject.current ?? "") + " " + debouncedValue.current;
    return findMissingPlaceholders(combined, leads, customFields);
  });

  $effect(() => {
    if (!selectedPreviewLeadId) {
      return;
    }

    if (
      previewableLeads.some((lead) => lead.id === selectedPreviewLeadId)
    ) {
      return;
    }

    selectedPreviewLeadId = "";
  });

  function updateTemplateVariablePreview() {
    if (!editorElement) return;

    const variableNodes = editorElement.querySelectorAll<HTMLElement>(
      '[data-type="template-variable"]'
    );

    for (const node of variableNodes) {
      const variableId = node.dataset.variableId;
      if (!variableId) continue;

      const preview = getTemplateVariablePreview(
        variableId,
        selectedPreviewLead
      );

      node.textContent = preview.text;
      node.dataset.previewState = preview.state;
      node.title = `{{${variableId}}}`;
    }
  }

  // Initialize TipTap editor
  $effect(() => {
    const mountElement = editorElement;
    if (!mountElement) return;

    return untrack(() => {
      const initialPlaceholder =
        placeholder ?? "Start writing your email...";
      const initialContent = preprocessTemplateHtml(value);

      const TemplateVariableWithSuggestion = createVariableSuggestion({
        getVariables: () => getAllTemplateVariables(customFields),
        onStart: (props: SuggestionCallbackProps) => {
          suggestionItems = props.items;
          suggestionCommand = props.command;
          suggestionClientRect = props.clientRect;
          suggestionOpen = true;
        },
        onUpdate: (props: SuggestionCallbackProps) => {
          suggestionItems = props.items;
          suggestionCommand = props.command;
          suggestionClientRect = props.clientRect;
        },
        onExit: () => {
          suggestionOpen = false;
          suggestionItems = [];
          suggestionCommand = null;
          suggestionClientRect = null;
        },
        onKeyDown: (event: KeyboardEvent) => {
          if (!variablePopupRef) return false;
          return variablePopupRef.handleKeyDown(event);
        },
      });

      const instance = new Editor({
        element: mountElement,
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            link: false,
            underline: false,
          }),
          Underline,
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              rel: "noopener noreferrer",
              target: "_blank",
            },
          }),
          TextAlign.configure({
            types: ["heading", "paragraph"],
          }),
          Placeholder.configure({
            placeholder: initialPlaceholder,
          }),
          TemplateVariableWithSuggestion,
          EmailButton,
        ],
        content: initialContent,
        onUpdate: ({ editor: ed }) => {
          isUpdatingFromEditor = true;
          value = normalizeTemplateEditorHtml(
            postprocessTemplateHtml(ed.getHTML())
          );
          editorVersion++;
          isUpdatingFromEditor = false;
        },
        onTransaction: () => {
          // Force Svelte to re-render toolbar active states
          editorVersion++;
        },
      });

      editor = instance;

      return () => {
        instance.destroy();
        editor = null;
      };
    });
  });

  // Sync external value changes into the editor (e.g. AI-generated drafts)
  $effect(() => {
    // Track value changes
    void value;

    if (!editor || isUpdatingFromEditor) return;

    const currentHtml = normalizeTemplateEditorHtml(
      postprocessTemplateHtml(editor.getHTML())
    );
    const nextValue = normalizeTemplateEditorHtml(value);

    if (currentHtml !== nextValue) {
      editor.commands.setContent(preprocessTemplateHtml(nextValue), {
        emitUpdate: false,
      });
      editorVersion++;
    }
  });

  $effect(() => {
    void selectedPreviewLead;
    void editorVersion;

    updateTemplateVariablePreview();
  });

  // Hidden input for form submission
  const hiddenName = $derived(name);
  const hiddenValue = $derived(value);

  // Subject input variable autocomplete (kept from original)
  function getCursorPixelPosition(el: HTMLInputElement): {
    x: number;
    y: number;
  } {
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

    return {
      x: rect.left + (cursorRect.left - mirrorRect.left),
      y: rect.top + (cursorRect.top - mirrorRect.top) + 20,
    };
  }

  function checkForDoubleBrace(el: HTMLInputElement): boolean {
    const pos = el.selectionStart ?? 0;
    return pos >= 2 && el.value.slice(pos - 2, pos) === "{{";
  }

  function handleSubjectInput(
    event: Event & { currentTarget: HTMLInputElement }
  ) {
    const el = event.currentTarget;
    if (checkForDoubleBrace(el)) {
      const pos = getCursorPixelPosition(el);
      subjectMenuX = pos.x;
      subjectMenuY = pos.y;
      subjectMenuOpen = true;
    }
  }

  function insertSubjectToken(token: string) {
    const el = subjectInputRef;
    if (!el) {
      subjectMenuOpen = false;
      return;
    }

    const pos = el.selectionStart ?? 0;
    const before = el.value.slice(0, pos - 2);
    const after = el.value.slice(pos);
    subject = before + token + after;

    const newPos = before.length + token.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });

    subjectMenuOpen = false;
  }

  function closeSubjectMenu() {
    subjectMenuOpen = false;
  }
</script>

<!-- Subject input variable menu (plain text input, kept as-is) -->
<TemplateVariableMenu
  open={subjectMenuOpen}
  x={subjectMenuX}
  y={subjectMenuY}
  {customFields}
  onInsert={insertSubjectToken}
  onClose={closeSubjectMenu}
/>

<!-- Suggestion popup for body editor -->
{#if suggestionOpen && suggestionCommand}
  <EditorVariablePopup
    bind:this={variablePopupRef}
    items={suggestionItems}
    command={suggestionCommand}
    clientRect={suggestionClientRect}
  />
{/if}

<div class="flex flex-col gap-3">
  <!-- Hidden input for form submission -->
  <input type="hidden" name={hiddenName} value={hiddenValue} />

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
        oninput={handleSubjectInput}
        class="bg-surface focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-10 w-full border-2 border-neutral-800 px-3 py-2 font-mono text-sm text-neutral-900 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      />
    </div>
  {/if}

  <div class="flex flex-wrap items-center justify-between gap-2">
    <span class="text-sm font-semibold text-neutral-700">Email Body</span>
    <div class="flex flex-wrap items-center gap-3">
      {#if previewableLeads.length > 0}
        <label
          class="flex items-center gap-2 text-xs font-medium text-neutral-600"
        >
          <span>Preview lead</span>
          <select
            bind:value={selectedPreviewLeadId}
            class="bg-surface h-8 border-2 border-neutral-800 px-2 font-mono text-xs text-neutral-900"
          >
            <option value="">No preview</option>
            {#each previewableLeads as lead (lead.id)}
              <option value={lead.id}>{lead.name}</option>
            {/each}
          </select>
        </label>
      {/if}

      <div class="text-xs text-neutral-500">
        {value.length} characters
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-0">
    <!-- Editor toolbar + content area -->
    {#if editor}
      <EditorToolbar
        {editor}
        variables={allVariables}
        version={editorVersion}
      />
    {/if}

    <div
      bind:this={editorElement}
      class="tiptap-editor border-2 border-neutral-800 bg-white"
    ></div>
  </div>

  {#if missingPlaceholders.length > 0}
    <div class="border-2 border-amber-600 bg-amber-50 px-3 py-2.5">
      <p class="text-sm font-bold tracking-wider text-amber-800 uppercase">
        Missing placeholder data
      </p>
      <ul class="mt-1 space-y-0.5">
        {#each missingPlaceholders as { token, missingCount } (token)}
          <li class="text-xs text-amber-700">
            <code class="bg-amber-100 px-1 py-0.5 font-mono">{token}</code>
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
    Tip: type <code class="bg-neutral-100 px-1 py-0.5 font-mono"
      >&#123;&#123;</code
    >
    in the body to insert a variable, or use the
    <code class="bg-neutral-100 px-1 py-0.5 font-mono">&#123;&#123;</code>
    toolbar button.
  </p>
</div>
