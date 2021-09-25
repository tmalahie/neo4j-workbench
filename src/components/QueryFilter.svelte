<script lang="ts">
  import { Input } from "sveltestrap";
  import type { NodeCol } from "./QueryViewer.svelte";

  export let column: NodeCol;
</script>

<th
  ><Input
    name={column.key}
    form="query-result-filter"
    placeholder="Filter..."
  /></th
>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  th {
    & :global(input.form-control) {
      padding: 0.125rem 0.25rem;
      font-size: 0.625rem;
      width: 100%;
    }
  }
</style>
