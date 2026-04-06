import { describe, it, expect } from "bun:test";
import {
  normalizeTemplateEditorHtml,
  preprocessTemplateHtml,
  postprocessTemplateHtml,
} from "./tiptap-template-variable";

describe("preprocessTemplateHtml", () => {
  it("wraps a single template variable in a span", () => {
    const input = "<p>Hello {{lead.name}}</p>";
    const result = preprocessTemplateHtml(input);
    expect(result).toBe(
      '<p>Hello <span data-type="template-variable" data-variable-id="lead.name">{{lead.name}}</span></p>'
    );
  });

  it("wraps multiple template variables", () => {
    const input = "<p>{{lead.name}} — {{lead.email}}</p>";
    const result = preprocessTemplateHtml(input);
    expect(result).toContain(
      'data-variable-id="lead.name">{{lead.name}}</span>'
    );
    expect(result).toContain(
      'data-variable-id="lead.email">{{lead.email}}</span>'
    );
  });

  it("wraps custom field variables", () => {
    const input = "{{custom.industry}}";
    const result = preprocessTemplateHtml(input);
    expect(result).toBe(
      '<span data-type="template-variable" data-variable-id="custom.industry">{{custom.industry}}</span>'
    );
  });

  it("handles text with no variables", () => {
    const input = "<p>Hello world</p>";
    const result = preprocessTemplateHtml(input);
    expect(result).toBe("<p>Hello world</p>");
  });

  it("handles empty string", () => {
    expect(preprocessTemplateHtml("")).toBe("");
  });

  it("handles variables with underscores", () => {
    const input = "{{lead.google_maps_url}}";
    const result = preprocessTemplateHtml(input);
    expect(result).toContain('data-variable-id="lead.google_maps_url"');
  });

  it("does not wrap incomplete braces", () => {
    const input = "{{incomplete";
    const result = preprocessTemplateHtml(input);
    expect(result).toBe("{{incomplete");
  });
});

describe("postprocessTemplateHtml", () => {
  it("converts a span back to raw template token", () => {
    const input =
      '<p>Hello <span data-type="template-variable" data-variable-id="lead.name" class="tiptap-template-variable" contenteditable="false">{{lead.name}}</span></p>';
    const result = postprocessTemplateHtml(input);
    expect(result).toBe("<p>Hello {{lead.name}}</p>");
  });

  it("converts multiple spans back", () => {
    const input =
      '<span data-type="template-variable" data-variable-id="lead.name" class="tiptap-template-variable" contenteditable="false">{{lead.name}}</span> and <span data-type="template-variable" data-variable-id="lead.email" class="tiptap-template-variable" contenteditable="false">{{lead.email}}</span>';
    const result = postprocessTemplateHtml(input);
    expect(result).toBe("{{lead.name}} and {{lead.email}}");
  });

  it("handles HTML with no template variable spans", () => {
    const input = "<p>Hello world</p>";
    const result = postprocessTemplateHtml(input);
    expect(result).toBe("<p>Hello world</p>");
  });

  it("handles empty string", () => {
    expect(postprocessTemplateHtml("")).toBe("");
  });

  it("handles custom field spans", () => {
    const input =
      '<span data-type="template-variable" data-variable-id="custom.industry" class="tiptap-template-variable" contenteditable="false">{{custom.industry}}</span>';
    const result = postprocessTemplateHtml(input);
    expect(result).toBe("{{custom.industry}}");
  });
});

describe("round-trip: preprocess -> postprocess", () => {
  it("preserves raw template HTML through round-trip", () => {
    const original =
      "<p>Hello {{lead.name}}, your email is {{lead.email}}</p>";
    const preprocessed = preprocessTemplateHtml(original);
    const postprocessed = postprocessTemplateHtml(preprocessed);
    expect(postprocessed).toBe(original);
  });

  it("preserves HTML with no variables through round-trip", () => {
    const original = "<p>No variables here</p>";
    const preprocessed = preprocessTemplateHtml(original);
    const postprocessed = postprocessTemplateHtml(preprocessed);
    expect(postprocessed).toBe(original);
  });

  it("preserves mixed content through round-trip", () => {
    const original =
      '<h1>Welcome</h1><p>Hi {{lead.name}},</p><p>Visit <a href="https://example.com">our site</a></p><p>{{custom.offer}}</p>';
    const preprocessed = preprocessTemplateHtml(original);
    const postprocessed = postprocessTemplateHtml(preprocessed);
    expect(postprocessed).toBe(original);
  });
});

describe("normalizeTemplateEditorHtml", () => {
  it("treats empty string as empty content", () => {
    expect(normalizeTemplateEditorHtml("")).toBe("");
    expect(normalizeTemplateEditorHtml("   ")).toBe("");
  });

  it("normalizes TipTap empty paragraphs to empty string", () => {
    expect(normalizeTemplateEditorHtml("<p></p>")).toBe("");
    expect(normalizeTemplateEditorHtml("<p><br></p>")).toBe("");
  });

  it("preserves non-empty content while trimming outer whitespace", () => {
    expect(normalizeTemplateEditorHtml("  <p>Hello</p>\n")).toBe(
      "<p>Hello</p>"
    );
  });
});
