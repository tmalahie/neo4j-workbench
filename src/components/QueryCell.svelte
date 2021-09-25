<script lang="ts">
  import { nodeDataToValue, stringToNodeData } from "src/helpers/db";
  import { showError } from "src/helpers/errors";

  import type { NodeRow, NodeCol, NodeCell } from "./QueryViewer.svelte";
  export let row: NodeRow;
  export let column: NodeCol;
  export let onUpdateRows: () => void;

  function handleCellKeyPress(event, cell: NodeCell) {
    if (event.code === "Enter") handleCellChange(cell);
    else if (event.code === "Escape") handleCellExit(cell);
  }
  function handleCellExit(cell: NodeCell) {
    cell.nextValue = cell.lastValue;
    cell.editing = false;
    onUpdateRows();
  }
  async function handleCellChange(cell: NodeCell) {
    if (cell.nextValue !== cell.lastValue) {
      try {
        const nextValueParsed = stringToNodeData(cell.nextValue);
        cell.value = nextValueParsed;
      } catch (e) {
        await showError(e);
        cell.editing = true;
        postSelectCell();
        onUpdateRows();
        return;
      }
      cell.edited = true;
      cell.lastValue = cell.nextValue;
    }
    cell.editing = false;
    onUpdateRows();
  }
  function handleCellStartEdit(cell: NodeCell) {
    if (!cell.readOnly) {
      cell.editing = true;
      onUpdateRows();
      postSelectCell();
    }
  }
  function postSelectCell() {
    setTimeout(() => {
      if (input) {
        const value = input.value;
        if (value.match(/^".*"$/g)) {
          input.focus();
          input.setSelectionRange(1, value.length - 1);
        } else input.select();
      }
    });
  }

  $: cell = row.groups[column.group].cells[column.key];
  let input: HTMLInputElement;
</script>

<td class:cell-edited={cell.edited}>
  {#if cell.editing}
    <div class="cell-edit">
      <input
        type="text"
        bind:this={input}
        bind:value={cell.nextValue}
        on:keydown={(event) => handleCellKeyPress(event, cell)}
        on:blur={() => handleCellChange(cell)}
      />
    </div>
  {:else}
    <div
      class="cell-view"
      class:cell-view-null={cell.value == null}
      on:dblclick={() => handleCellStartEdit(cell)}
    >
      {nodeDataToValue(cell.value)}
    </div>
  {/if}
</td>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  $cell-inner-color: $gray-400;

  td {
    padding: 0;
    border: 1px solid $cell-inner-color;
    cursor: default;
    &.cell-edited {
      border-color: $blue-300;
      background-color: $blue-100;
    }
    > .cell-view {
      width: 10em;
      min-width: 100%;
      height: 1.75rem;
      padding: 0.5em;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      &.cell-view-null {
        color: $gray-500;
      }
    }
    > .cell-edit > input {
      width: 100%;
      height: 100%;
      padding: 0.5em;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
    }
  }
</style>
