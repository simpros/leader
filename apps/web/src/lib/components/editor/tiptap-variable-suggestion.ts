import { PluginKey } from "@tiptap/pm/state";
import Suggestion, {
  type SuggestionMatch,
  type Trigger,
} from "@tiptap/suggestion";
import { TemplateVariable } from "./tiptap-template-variable.js";
import type { TemplateVariable as TemplateVariableType } from "../template-variables.js";
import type { Editor } from "@tiptap/core";

export type SuggestionItem = {
  id: string;
  label: string;
  group: string;
  description?: string;
};

export type VariableSuggestionOptions = {
  /** Called when the suggestion popup should be shown. */
  onStart: (props: SuggestionCallbackProps) => void;
  /** Called when the suggestion query changes (e.g. user types more). */
  onUpdate: (props: SuggestionCallbackProps) => void;
  /** Called when the suggestion popup should be hidden. */
  onExit: () => void;
  /** Called when the user presses keyboard navigation keys. */
  onKeyDown: (event: KeyboardEvent) => boolean;
  /** Returns the list of available template variables. */
  getVariables: () => TemplateVariableType[];
};

export type SuggestionCallbackProps = {
  query: string;
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  clientRect: (() => DOMRect | null) | null;
  editor: Editor;
};

const DOUBLE_BRACE_QUERY_REGEX = /\{\{[^\s{}]*$/;

export function findVariableSuggestionMatch({
  $position,
  allowedPrefixes,
}: Trigger): SuggestionMatch {
  const text = $position.nodeBefore?.isText
    ? $position.nodeBefore.text
    : null;

  if (!text) {
    return null;
  }

  const match = DOUBLE_BRACE_QUERY_REGEX.exec(text);

  if (!match || match.index === undefined) {
    return null;
  }

  if (allowedPrefixes !== null) {
    const prefix = match.index > 0 ? (text[match.index - 1] ?? "") : "";

    if (prefix !== "" && !allowedPrefixes.includes(prefix)) {
      return null;
    }
  }

  const textFrom = $position.pos - text.length;
  const from = textFrom + match.index;
  const to = from + match[0].length;

  if (!(from < $position.pos && to >= $position.pos)) {
    return null;
  }

  return {
    range: { from, to },
    query: match[0].slice(2),
    text: match[0],
  };
}

/**
 * Creates a TipTap plugin that handles `{{` trigger for template variable
 * autocompletion. Uses TipTap's Suggestion utility under the hood.
 *
 * The suggestion inserts a `templateVariable` node when the user
 * selects an item from the autocomplete popup.
 */
export function createVariableSuggestion(
  options: VariableSuggestionOptions
) {
  return TemplateVariable.extend({
    addProseMirrorPlugins() {
      return [
        ...(this.parent?.() ?? []),
        Suggestion({
          editor: this.editor,
          char: "{{",
          pluginKey: new PluginKey("templateVariableSuggestion"),
          allowSpaces: false,
          allowedPrefixes: null,
          findSuggestionMatch: findVariableSuggestionMatch,

          items: ({ query }) => {
            const variables = options.getVariables();
            const items: SuggestionItem[] = variables.map((v) => ({
              id: v.token.slice(2, -2), // Remove {{ and }}
              label: v.label,
              group: v.group,
              description: v.description,
            }));

            if (!query) return items;

            const lower = query.toLowerCase();
            return items.filter(
              (item) =>
                item.label.toLowerCase().includes(lower) ||
                item.id.toLowerCase().includes(lower) ||
                (item.description?.toLowerCase().includes(lower) ?? false)
            );
          },

          command: ({ editor, range, props }) => {
            const item = props as unknown as SuggestionItem;
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertTemplateVariable(item.id)
              .run();
          },

          render: () => ({
            onStart: (props) => {
              const items = props.items as SuggestionItem[];
              const command = (item: SuggestionItem) => {
                props.command(item as Record<string, unknown>);
              };
              options.onStart({
                query: props.query,
                items,
                command,
                clientRect: props.clientRect ?? null,
                editor: props.editor,
              });
            },
            onUpdate: (props) => {
              const items = props.items as SuggestionItem[];
              const command = (item: SuggestionItem) => {
                props.command(item as Record<string, unknown>);
              };
              options.onUpdate({
                query: props.query,
                items,
                command,
                clientRect: props.clientRect ?? null,
                editor: props.editor,
              });
            },
            onKeyDown: ({ event }) => {
              return options.onKeyDown(event);
            },
            onExit: () => {
              options.onExit();
            },
          }),
        }),
      ];
    },
  });
}
