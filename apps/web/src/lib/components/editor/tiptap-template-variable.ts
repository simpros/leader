import { Node, mergeAttributes } from "@tiptap/core";

export type TemplateVariableOptions = {
  /** Extra HTML attributes added to every rendered node. */
  HTMLAttributes: Record<string, string>;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    templateVariable: {
      /** Insert a template variable node at the current cursor position. */
      insertTemplateVariable: (variableId: string) => ReturnType;
    };
  }
}

/**
 * A TipTap node representing a `{{variable}}` template placeholder.
 *
 * - Inline, atomic (non-editable within the editor).
 * - Stores the variable identifier (e.g. `lead.name`) in the `variableId` attr.
 * - Renders as a styled `<span>` pill in the editor.
 * - Serializes to `{{lead.name}}` in HTML output so the existing
 *   `resolveTemplate()` backend logic works unchanged.
 * - Parses `{{...}}` text back into nodes when loading saved content.
 */
export const TemplateVariable = Node.create<TemplateVariableOptions>({
  name: "templateVariable",

  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      variableId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable-id"),
        renderHTML: (attributes) => ({
          "data-variable-id": attributes.variableId as string,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="template-variable"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const variableId = node.attrs.variableId as string;

    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "template-variable",
        "data-variable-id": variableId,
        class: "tiptap-template-variable",
        contenteditable: "false",
      }),
      `{{${variableId}}}`,
    ];
  },

  addCommands() {
    return {
      insertTemplateVariable:
        (variableId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variableId },
          });
        },
    };
  },
});

/**
 * Regex that matches `{{variableId}}` tokens in plain text.
 * Used to convert raw HTML containing template tokens into
 * ProseMirror nodes on content load.
 */
const TEMPLATE_TOKEN_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Pre-processes HTML to convert raw `{{variable}}` text into
 * `<span data-type="template-variable" data-variable-id="variable">{{variable}}</span>`
 * so TipTap's `parseHTML` can pick them up.
 *
 * This is necessary because saved/AI-generated content contains raw
 * `{{lead.name}}` strings rather than the `<span>` wrapper format.
 */
export function preprocessTemplateHtml(html: string): string {
  return html.replace(
    TEMPLATE_TOKEN_REGEX,
    (_match, variableId: string) => {
      return `<span data-type="template-variable" data-variable-id="${variableId}">{{${variableId}}}</span>`;
    }
  );
}

/**
 * Post-processes HTML output from TipTap to convert
 * `<span data-type="template-variable" ...>{{var}}</span>` back to
 * raw `{{var}}` strings for storage and email sending.
 */
export function postprocessTemplateHtml(html: string): string {
  return html.replace(
    /<span[^>]*data-type="template-variable"[^>]*data-variable-id="([^"]*)"[^>]*>[^<]*<\/span>/g,
    (_match, variableId: string) => `{{${variableId}}}`
  );
}

/**
 * Normalizes TipTap's empty document HTML to the empty string used by forms/storage.
 *
 * TipTap represents an empty document as a blank paragraph, which is equivalent
 * to no content for this editor. Normalizing these shapes prevents sync loops
 * between the external bound value and the internal editor document.
 */
export function normalizeTemplateEditorHtml(html: string): string {
  const trimmed = html.trim();

  if (
    trimmed === "" ||
    trimmed === "<p></p>" ||
    trimmed === "<p><br></p>"
  ) {
    return "";
  }

  return trimmed;
}
