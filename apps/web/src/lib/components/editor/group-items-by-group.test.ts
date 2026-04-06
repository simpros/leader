import { describe, expect, it } from "bun:test";
import { groupItemsByGroup } from "./group-items-by-group";

describe("groupItemsByGroup", () => {
  it("returns no groups when given no items", () => {
    expect(groupItemsByGroup([])).toEqual([]);
  });

  it("preserves first-seen group order and item order within each group", () => {
    const items = [
      { id: "1", group: "Lead fields" },
      { id: "2", group: "Custom fields" },
      { id: "3", group: "Lead fields" },
      { id: "4", group: "Meta" },
      { id: "5", group: "Custom fields" },
    ];

    expect(groupItemsByGroup(items)).toEqual([
      {
        group: "Lead fields",
        items: [items[0], items[2]],
      },
      {
        group: "Custom fields",
        items: [items[1], items[4]],
      },
      {
        group: "Meta",
        items: [items[3]],
      },
    ]);
  });

  it("supports group names that overlap with object property names", () => {
    const items = [
      { id: "1", group: "__proto__" },
      { id: "2", group: "constructor" },
      { id: "3", group: "__proto__" },
    ];

    expect(groupItemsByGroup(items)).toEqual([
      {
        group: "__proto__",
        items: [items[0], items[2]],
      },
      {
        group: "constructor",
        items: [items[1]],
      },
    ]);
  });
});
