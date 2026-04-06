type GroupedItems<T> = {
  group: string;
  items: T[];
};

export function groupItemsByGroup<T extends { group: string }>(
  items: readonly T[]
): GroupedItems<T>[] {
  const groupedItems = Object.create(null) as Record<string, T[]>;
  const groupOrder: string[] = [];

  for (const item of items) {
    const group = groupedItems[item.group];

    if (group) {
      group.push(item);
      continue;
    }

    groupedItems[item.group] = [item];
    groupOrder.push(item.group);
  }

  return groupOrder.map((group) => ({
    group,
    items: groupedItems[group] ?? [],
  }));
}
