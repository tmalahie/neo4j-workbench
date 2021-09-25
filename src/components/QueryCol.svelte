<script lang="ts">
  import { Icon } from "sveltestrap";

  import { lastKey } from "./QueryViewer.svelte";
  import type { CypherSort, NodeCol } from "./QueryViewer.svelte";

  export let column: NodeCol;
  export let sort: CypherSort;
  export let onSort: (sort: CypherSort) => void;

  function handleSort(key) {
    if (sort?.key === key) sort.order = sort.order === "DESC" ? "ASC" : "DESC";
    else sort.order = "ASC";
    sort.key = key;
    sort = sort;
    onSort(sort);
  }
</script>

<th>
  <div class="query-result-column">
    <div class="query-result-column-title">
      {lastKey(column.key)}
    </div>
    <div class="query-result-column-margin" />
  </div>
  <div
    class="query-result-sort"
    class:query-result-sort-active={column.key === sort?.key}
    on:click={() => handleSort(column.key)}
  >
    {#if column.key !== sort?.key}
      <Icon name="sort-down-alt" />
    {:else}
      <Icon
        name={sort.order === "DESC" ? "sort-alpha-up-alt" : "sort-alpha-down"}
      />
    {/if}
  </div>
</th>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  th {
    > .query-result-column {
      display: inline-block;
      white-space: nowrap;
      > .query-result-column-title {
        display: inline-block;
        min-width: 10em;
      }
      > .query-result-column-margin {
        display: inline-block;
        width: 0.75rem;
      }
    }
    > .query-result-sort {
      position: absolute;
      display: inline-block;
      right: 0.25rem;
      cursor: pointer;
      &.query-result-sort-active {
        color: $primary;
      }
    }
  }
</style>
