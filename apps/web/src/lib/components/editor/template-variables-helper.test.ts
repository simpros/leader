import { describe, it, expect } from "bun:test";
import {
  getAllTemplateVariables,
  CORE_LEAD_VARIABLES,
  getTemplateVariablePreview,
  highlightResolved,
} from "../template-variables";

describe("getAllTemplateVariables", () => {
  it("returns core variables when no custom fields", () => {
    const result = getAllTemplateVariables([]);
    expect(result).toEqual(CORE_LEAD_VARIABLES);
  });

  it("includes custom fields after core variables", () => {
    const customFields = [{ name: "industry" }, { name: "revenue" }];
    const result = getAllTemplateVariables(customFields);

    expect(result.length).toBe(CORE_LEAD_VARIABLES.length + 2);

    const customItems = result.slice(CORE_LEAD_VARIABLES.length);
    expect(customItems[0]).toEqual({
      token: "{{custom.industry}}",
      label: "custom.industry",
      group: "Custom fields",
    });
    expect(customItems[1]).toEqual({
      token: "{{custom.revenue}}",
      label: "custom.revenue",
      group: "Custom fields",
    });
  });

  it("preserves core variable structure", () => {
    const result = getAllTemplateVariables([]);
    const leadName = result.find((v) => v.token === "{{lead.name}}");
    expect(leadName).toBeDefined();
    expect(leadName!.label).toBe("lead.name");
    expect(leadName!.group).toBe("Lead fields");
    expect(leadName!.description).toBe("Business name");
  });

  it("all core variables have group 'Lead fields'", () => {
    const result = getAllTemplateVariables([]);
    for (const v of result) {
      expect(v.group).toBe("Lead fields");
    }
  });
});

describe("highlightResolved", () => {
  it("replaces lead placeholders with highlighted values", () => {
    const result = highlightResolved(
      "<p>Hello {{lead.name}}</p>",
      {
        placeId: "place-1",
        name: "Acme Corp",
      },
      []
    );

    expect(result).toContain("<mark");
    expect(result).toContain("Acme Corp");
    expect(result).not.toContain("{{lead.name}}");
  });

  it("keeps missing placeholders visible with warning styling", () => {
    const result = highlightResolved(
      "<p>Hello {{lead.email}}</p>",
      {
        placeId: "place-1",
        name: "Acme Corp",
        email: null,
      },
      []
    );

    expect(result).toContain("{{lead.email}}");
    expect(result).toContain("#fee2e2");
  });
});

describe("getTemplateVariablePreview", () => {
  it("returns the raw token when no lead is selected", () => {
    expect(getTemplateVariablePreview("lead.name", null)).toEqual({
      text: "{{lead.name}}",
      state: "raw",
    });
  });

  it("returns the raw token when preview is explicitly cleared", () => {
    expect(getTemplateVariablePreview("lead.email", null)).toEqual({
      text: "{{lead.email}}",
      state: "raw",
    });
  });

  it("returns the resolved lead value when present", () => {
    expect(
      getTemplateVariablePreview("lead.name", {
        placeId: "place-1",
        name: "Acme Corp",
      })
    ).toEqual({
      text: "Acme Corp",
      state: "resolved",
    });
  });

  it("marks known lead variables as missing when empty", () => {
    expect(
      getTemplateVariablePreview("lead.email", {
        placeId: "place-1",
        name: "Acme Corp",
        email: null,
      })
    ).toEqual({
      text: "{{lead.email}}",
      state: "missing",
    });
  });

  it("keeps custom variables as raw tokens", () => {
    expect(
      getTemplateVariablePreview("custom.industry", {
        placeId: "place-1",
        name: "Acme Corp",
      })
    ).toEqual({
      text: "{{custom.industry}}",
      state: "raw",
    });
  });
});
