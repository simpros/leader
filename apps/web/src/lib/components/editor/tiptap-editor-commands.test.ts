import { describe, expect, it } from "bun:test";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TemplateVariable } from "./tiptap-template-variable";
import { EmailButton } from "./tiptap-email-button";

function createEditor(content = "<p>Hello</p>") {
  const element = document.createElement("div");
  document.body.appendChild(element);

  return new Editor({
    element,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder,
      TemplateVariable,
      EmailButton,
    ],
    content,
  });
}

describe("TipTap editor commands", () => {
  it("inserts a template variable inline", () => {
    const editor = createEditor();

    editor.commands.focus("end");
    const inserted = editor.commands.insertTemplateVariable("lead.name");

    expect(inserted).toBe(true);
    expect(editor.getHTML()).toContain('data-type="template-variable"');
    expect(editor.getHTML()).toContain("{{lead.name}}");

    editor.destroy();
  });

  it("inserts an email button block", () => {
    const editor = createEditor();

    editor.commands.focus("end");
    const inserted = editor.commands.insertEmailButton({
      text: "Book a Call",
      url: "https://example.com",
      backgroundColor: "#c4520a",
      textColor: "#ffffff",
    });

    expect(inserted).toBe(true);
    expect(editor.getHTML()).toContain('data-type="email-button"');
    expect(editor.getHTML()).toContain("Book a Call");
    expect(editor.getHTML()).toContain("https://example.com");

    editor.destroy();
  });

  it("applies a link to selected text", () => {
    const editor = createEditor("<p>Hello world</p>");

    editor.commands.setTextSelection({ from: 1, to: 6 });
    const inserted = editor.commands.setLink({
      href: "https://example.com",
    });

    expect(inserted).toBe(true);
    expect(editor.getHTML()).toContain('href="https://example.com"');

    editor.destroy();
  });
});
