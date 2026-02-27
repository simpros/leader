<script lang="ts">
  import { Menu } from "@leader/ui";
  import type { MenuItem } from "@leader/ui";
  import {
    CORE_LEAD_VARIABLES,
    customFieldToken,
  } from "./template-variables.js";

  type TemplateVariableMenuProps = {
    open: boolean;
    x: number;
    y: number;
    customFields: { name: string }[];
    onInsert: (token: string) => void;
    onClose: () => void;
  };

  let {
    open,
    x,
    y,
    customFields,
    onInsert,
    onClose,
  }: TemplateVariableMenuProps = $props();

  const items = $derived.by((): MenuItem[] => {
    const coreItems: MenuItem[] = CORE_LEAD_VARIABLES.map((v) => ({
      value: v.token,
      label: v.label,
      description: v.description,
      group: v.group,
    }));

    const customItems: MenuItem[] = customFields.map((f) => ({
      value: customFieldToken(f.name),
      label: `custom.${f.name}`,
      group: "Custom fields",
    }));

    return [...coreItems, ...customItems];
  });
</script>

<Menu {open} {items} onSelect={onInsert} {onClose} {x} {y} />
