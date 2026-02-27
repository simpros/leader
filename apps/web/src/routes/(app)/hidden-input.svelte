<script lang="ts">
  type HiddenInputProps = {
    name: string;
    value?: string | number | boolean | null;
  };

  let { name, value = "" }: HiddenInputProps = $props();

  const normalizedValue = $derived(value == null ? "" : String(value));
</script>

<input type="hidden" {name} value={normalizedValue} />
