import { describe, expect, it } from "bun:test";
import { EditorState } from "@tiptap/pm/state";
import { schema } from "@tiptap/pm/schema-basic";
import { findVariableSuggestionMatch } from "./tiptap-variable-suggestion";

function createTrigger(text: string) {
  const doc = schema.node("doc", undefined, [
    schema.node("paragraph", undefined, [schema.text(text)]),
  ]);
  const state = EditorState.create({ schema, doc });
  const paragraph = state.doc.firstChild;
  const textNode = paragraph?.firstChild;

  if (!paragraph || !textNode) {
    throw new Error("Failed to create test document");
  }

  return {
    char: "{{",
    allowSpaces: false,
    allowToIncludeChar: false,
    allowedPrefixes: null,
    startOfLine: false,
    $position: state.doc.resolve(paragraph.nodeSize - 1),
  } as const;
}

describe("findVariableSuggestionMatch", () => {
  it("matches a fresh double-brace trigger", () => {
    const match = findVariableSuggestionMatch(createTrigger("Hello {{"));

    expect(match).not.toBeNull();
    expect(match?.text).toBe("{{");
    expect(match?.query).toBe("");
  });

  it("matches a typed variable query after double braces", () => {
    const match = findVariableSuggestionMatch(
      createTrigger("Hello {{lead.na")
    );

    expect(match).not.toBeNull();
    expect(match?.text).toBe("{{lead.na");
    expect(match?.query).toBe("lead.na");
  });

  it("does not match a single opening brace", () => {
    const match = findVariableSuggestionMatch(createTrigger("Hello {"));

    expect(match).toBeNull();
  });

  it("does not match if whitespace appears after the trigger", () => {
    const match = findVariableSuggestionMatch(
      createTrigger("Hello {{ lead")
    );

    expect(match).toBeNull();
  });
});
