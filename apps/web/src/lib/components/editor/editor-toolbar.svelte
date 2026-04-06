<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import type { Selection } from "@tiptap/pm/state";
  import type { TemplateVariable } from "../template-variables.js";
  import type { EmailButtonAttrs } from "./tiptap-email-button.js";

  // Side-effect imports to register TipTap command types
  import "@tiptap/starter-kit";
  import "@tiptap/extension-underline";
  import "@tiptap/extension-link";
  import "@tiptap/extension-text-align";
  import "./tiptap-template-variable.js";
  import "./tiptap-email-button.js";

  type EditorToolbarProps = {
    editor: Editor;
    variables: TemplateVariable[];
    /** Incremented on every TipTap transaction to trigger active-state updates. */
    version: number;
  };

  let { editor, variables, version }: EditorToolbarProps = $props();

  let showVariableDropdown = $state(false);
  let showButtonForm = $state(false);
  let showLinkForm = $state(false);

  // Button form state
  let buttonText = $state("Click Here");
  let buttonUrl = $state("");
  let buttonBgColor = $state("#c4520a");
  let buttonTextColor = $state("#ffffff");

  // Link form state
  let linkUrl = $state("");
  let preservedSelection = $state<Selection | null>(null);

  /**
   * Reactive snapshot of editor active states.
   * Re-evaluated whenever `version` changes (i.e. on every TipTap transaction).
   * This replaces the old `{#key}` approach which destroyed the component.
   */
  const active = $derived.by(() => {
    // Reading `version` creates a reactive dependency so Svelte
    // re-evaluates this block on every TipTap transaction.
    void version;

    return {
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      link: editor.isActive("link"),
    };
  });

  // Group variables by group
  type GroupEntry = {
    group: string;
    items: TemplateVariable[];
  };

  const grouped = $derived.by((): GroupEntry[] => {
    const groupMap = new Map<string, TemplateVariable[]>();
    for (const v of variables) {
      const group = groupMap.get(v.group) ?? [];
      group.push(v);
      groupMap.set(v.group, group);
    }
    return [...groupMap.entries()].map(([group, items]) => ({
      group,
      items,
    }));
  });

  function rememberSelection() {
    preservedSelection = editor.state.selection;
  }

  function restoreSelection() {
    if (!preservedSelection) return editor.chain().focus();

    return editor.chain().focus().setTextSelection({
      from: preservedSelection.from,
      to: preservedSelection.to,
    });
  }

  function insertVariable(token: string) {
    // token is like "{{lead.name}}", extract the variable id
    const variableId = token.slice(2, -2);
    restoreSelection().insertTemplateVariable(variableId).run();
    showVariableDropdown = false;
    preservedSelection = null;
  }

  function insertEmailButton() {
    const attrs: EmailButtonAttrs = {
      text: buttonText.trim() || "Click Here",
      url: buttonUrl.trim() || "#",
      backgroundColor: buttonBgColor,
      textColor: buttonTextColor,
    };
    restoreSelection().insertEmailButton(attrs).run();
    showButtonForm = false;
    preservedSelection = null;
    buttonText = "Click Here";
    buttonUrl = "";
    buttonBgColor = "#c4520a";
    buttonTextColor = "#ffffff";
  }

  function setLink() {
    const url = linkUrl.trim();
    if (!url) {
      restoreSelection().unsetLink().run();
    } else {
      restoreSelection()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    showLinkForm = false;
    preservedSelection = null;
    linkUrl = "";
  }

  function openLinkForm() {
    rememberSelection();
    const existingHref = editor.getAttributes("link").href as
      | string
      | undefined;
    linkUrl = existingHref ?? "";
    showLinkForm = true;
  }

  function handleToolbarKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      showVariableDropdown = false;
      showButtonForm = false;
      showLinkForm = false;
    }
  }

  const btnBase =
    "flex h-8 w-8 items-center justify-center border border-neutral-300 text-sm transition-all duration-100 ease-out hover:bg-neutral-100 active:translate-y-px disabled:opacity-40 disabled:pointer-events-none";
  const btnActive =
    "bg-secondary-100 text-secondary-800 border-secondary-400";
  const btnInactive = "bg-white text-neutral-700";

  function btnClass(active: boolean): string {
    return `${btnBase} ${active ? btnActive : btnInactive}`;
  }
</script>

<div
  class="bg-surface flex flex-wrap items-center gap-1 border-2 border-b-0 border-neutral-800 px-2 py-1.5"
  role="toolbar"
  tabindex="-1"
  aria-label="Editor formatting toolbar"
  onkeydown={handleToolbarKeydown}
>
  <!-- Text formatting -->
  <div class="flex items-center">
    <button
      type="button"
      class={btnClass(active.bold)}
      onclick={() => editor.chain().focus().toggleBold().run()}
      title="Bold (Ctrl+B)"
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class={btnClass(active.italic)}
      onclick={() => editor.chain().focus().toggleItalic().run()}
      title="Italic (Ctrl+I)"
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class={btnClass(active.underline)}
      onclick={() => editor.chain().focus().toggleUnderline().run()}
      title="Underline (Ctrl+U)"
    >
      <u>U</u>
    </button>
    <button
      type="button"
      class={btnClass(active.strike)}
      onclick={() => editor.chain().focus().toggleStrike().run()}
      title="Strikethrough"
    >
      <s>S</s>
    </button>
  </div>

  <div class="mx-1 h-6 w-px bg-neutral-300"></div>

  <!-- Headings -->
  <div class="flex items-center">
    <button
      type="button"
      class={btnClass(active.h1)}
      onclick={() =>
        editor.chain().focus().toggleHeading({ level: 1 }).run()}
      title="Heading 1"
    >
      <span class="text-xs font-bold">H1</span>
    </button>
    <button
      type="button"
      class={btnClass(active.h2)}
      onclick={() =>
        editor.chain().focus().toggleHeading({ level: 2 }).run()}
      title="Heading 2"
    >
      <span class="text-xs font-bold">H2</span>
    </button>
    <button
      type="button"
      class={btnClass(active.h3)}
      onclick={() =>
        editor.chain().focus().toggleHeading({ level: 3 }).run()}
      title="Heading 3"
    >
      <span class="text-xs font-bold">H3</span>
    </button>
  </div>

  <div class="mx-1 h-6 w-px bg-neutral-300"></div>

  <!-- Lists -->
  <div class="flex items-center">
    <button
      type="button"
      class={btnClass(active.bulletList)}
      onclick={() => editor.chain().focus().toggleBulletList().run()}
      title="Bullet list"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="9" y1="6" x2="20" y2="6"></line>
        <line x1="9" y1="12" x2="20" y2="12"></line>
        <line x1="9" y1="18" x2="20" y2="18"></line>
        <circle cx="4" cy="6" r="1.5" fill="currentColor"></circle>
        <circle cx="4" cy="12" r="1.5" fill="currentColor"></circle>
        <circle cx="4" cy="18" r="1.5" fill="currentColor"></circle>
      </svg>
    </button>
    <button
      type="button"
      class={btnClass(active.orderedList)}
      onclick={() => editor.chain().focus().toggleOrderedList().run()}
      title="Numbered list"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="10" y1="6" x2="20" y2="6"></line>
        <line x1="10" y1="12" x2="20" y2="12"></line>
        <line x1="10" y1="18" x2="20" y2="18"></line>
        <text
          x="4"
          y="7"
          font-size="7"
          fill="currentColor"
          stroke="none"
          font-weight="bold">1</text
        >
        <text
          x="4"
          y="13"
          font-size="7"
          fill="currentColor"
          stroke="none"
          font-weight="bold">2</text
        >
        <text
          x="4"
          y="19"
          font-size="7"
          fill="currentColor"
          stroke="none"
          font-weight="bold">3</text
        >
      </svg>
    </button>
  </div>

  <div class="mx-1 h-6 w-px bg-neutral-300"></div>

  <!-- Alignment -->
  <div class="flex items-center">
    <button
      type="button"
      class={btnClass(active.alignLeft)}
      onclick={() => editor.chain().focus().setTextAlign("left").run()}
      title="Align left"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="15" y2="12"></line>
        <line x1="3" y1="18" x2="18" y2="18"></line>
      </svg>
    </button>
    <button
      type="button"
      class={btnClass(active.alignCenter)}
      onclick={() => editor.chain().focus().setTextAlign("center").run()}
      title="Align center"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="6" y1="12" x2="18" y2="12"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
    </button>
    <button
      type="button"
      class={btnClass(active.alignRight)}
      onclick={() => editor.chain().focus().setTextAlign("right").run()}
      title="Align right"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="9" y1="12" x2="21" y2="12"></line>
        <line x1="6" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>

  <div class="mx-1 h-6 w-px bg-neutral-300"></div>

  <!-- Link -->
  <div class="relative">
    <button
      type="button"
      class={btnClass(active.link)}
      onclick={openLinkForm}
      title="Insert link"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        ></path>
        <path
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        ></path>
      </svg>
    </button>
    {#if showLinkForm}
      <div
        class="absolute top-full left-0 z-50 mt-1 flex w-64 flex-col gap-2 border-2 border-neutral-800 bg-white p-3 shadow-lg"
      >
        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-neutral-600 uppercase"
            >URL</span
          >
          <input
            type="url"
            bind:value={linkUrl}
            placeholder="https://..."
            class="bg-surface focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-8 w-full border-2 border-neutral-800 px-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onkeydown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              }
            }}
          />
        </label>
        <div class="flex gap-1">
          <button
            type="button"
            class="bg-primary-500 hover:bg-primary-600 h-7 flex-1 border-2 border-neutral-800 text-xs font-bold tracking-wider text-white uppercase transition-all duration-100 active:translate-y-px"
            onclick={setLink}
          >
            {linkUrl.trim() ? "Set Link" : "Remove Link"}
          </button>
          <button
            type="button"
            class="h-7 border-2 border-neutral-800 bg-white px-3 text-xs font-bold tracking-wider text-neutral-700 uppercase transition-all duration-100 hover:bg-neutral-100 active:translate-y-px"
            onclick={() => (showLinkForm = false)}
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Horizontal rule -->
  <button
    type="button"
    class="{btnBase} {btnInactive}"
    onclick={() => editor.chain().focus().setHorizontalRule().run()}
    title="Horizontal rule"
  >
    <svg
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <line x1="3" y1="12" x2="21" y2="12"></line>
    </svg>
  </button>

  <div class="mx-1 h-6 w-px bg-neutral-300"></div>

  <!-- Insert Variable -->
  <div class="relative">
    <button
      type="button"
      class="{btnBase} {showVariableDropdown
        ? btnActive
        : btnInactive} !w-auto gap-1 px-2"
      onclick={() => {
        rememberSelection();
        showVariableDropdown = !showVariableDropdown;
        showButtonForm = false;
        showLinkForm = false;
      }}
      title="Insert template variable"
    >
      <span class="font-mono text-xs font-bold">{"{{"}</span>
      <svg
        class="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    {#if showVariableDropdown}
      <div
        class="absolute top-full left-0 z-50 mt-1 max-h-60 w-64 overflow-y-auto border-2 border-neutral-800 bg-white py-1 shadow-lg"
      >
        {#each grouped as { group, items } (group)}
          <div
            class="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-neutral-400 uppercase"
          >
            {group}
          </div>
          {#each items as v (v.token)}
            <button
              type="button"
              class="hover:bg-secondary-50 hover:text-secondary-800 flex w-full flex-col gap-0.5 px-3 py-2 text-left text-neutral-800 transition-colors"
              onclick={() => insertVariable(v.token)}
            >
              <span class="font-mono text-sm font-medium">{v.label}</span>
              {#if v.description}
                <span class="text-xs text-neutral-400"
                  >{v.description}</span
                >
              {/if}
            </button>
          {/each}
        {/each}
      </div>
    {/if}
  </div>

  <!-- Insert Button -->
  <div class="relative">
    <button
      type="button"
      class="{btnBase} {showButtonForm
        ? btnActive
        : btnInactive} !w-auto gap-1 px-2"
      onclick={() => {
        rememberSelection();
        showButtonForm = !showButtonForm;
        showVariableDropdown = false;
        showLinkForm = false;
      }}
      title="Insert CTA button"
    >
      <span class="text-xs font-bold">BTN</span>
    </button>
    {#if showButtonForm}
      <div
        class="absolute top-full right-0 z-50 mt-1 flex w-72 flex-col gap-3 border-2 border-neutral-800 bg-white p-3 shadow-lg"
      >
        <span
          class="text-xs font-bold tracking-wider text-neutral-600 uppercase"
          >Insert CTA Button</span
        >
        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-neutral-600 uppercase"
            >Button Text</span
          >
          <input
            type="text"
            bind:value={buttonText}
            placeholder="Click Here"
            class="bg-surface focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-8 w-full border-2 border-neutral-800 px-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-neutral-600 uppercase"
            >URL</span
          >
          <input
            type="url"
            bind:value={buttonUrl}
            placeholder="https://..."
            class="bg-surface focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-8 w-full border-2 border-neutral-800 px-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </label>
        <div class="flex items-center gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-neutral-600 uppercase"
              >Background</span
            >
            <div class="flex items-center gap-1.5">
              <input
                type="color"
                bind:value={buttonBgColor}
                class="h-8 w-8 cursor-pointer border-2 border-neutral-800"
              />
              <span class="font-mono text-xs text-neutral-500"
                >{buttonBgColor}</span
              >
            </div>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-neutral-600 uppercase"
              >Text Color</span
            >
            <div class="flex items-center gap-1.5">
              <input
                type="color"
                bind:value={buttonTextColor}
                class="h-8 w-8 cursor-pointer border-2 border-neutral-800"
              />
              <span class="font-mono text-xs text-neutral-500"
                >{buttonTextColor}</span
              >
            </div>
          </label>
        </div>
        <div class="flex gap-1">
          <button
            type="button"
            class="bg-primary-500 hover:bg-primary-600 h-8 flex-1 border-2 border-neutral-800 text-xs font-bold tracking-wider text-white uppercase transition-all duration-100 active:translate-y-px"
            onclick={insertEmailButton}
          >
            Insert
          </button>
          <button
            type="button"
            class="h-8 border-2 border-neutral-800 bg-white px-3 text-xs font-bold tracking-wider text-neutral-700 uppercase transition-all duration-100 hover:bg-neutral-100 active:translate-y-px"
            onclick={() => (showButtonForm = false)}
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
