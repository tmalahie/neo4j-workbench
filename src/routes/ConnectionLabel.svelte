<script lang="ts">
  export let params: { id: string; label: string };
  import GoBack from "src/components/GoBack.svelte";
  import { executeQuery } from "src/helpers/db";
  import type { NodeResult } from "src/helpers/db";
  import { showError } from "src/helpers/errors";
  import { Table } from "sveltestrap";
import { bootbox } from "bootbox-svelte";

  function propsToKey(props: string[]) {
    return props.join("::");
  }
  function keyToProps(key: string) {
    return key.split("::");
  }
  function lastKey(key: string) {
    const props = keyToProps(key);
    return props[props.length - 1];
  }

  function isDbNumber(data) {
    return (typeof data?.low === "number") && (typeof data?.high === "number") && Object.keys(data).length === 2;
  }
  const BIGINT_SEPARATOR = BigInt(Math.pow(2,32));
  function nodeDataToString(data) {
    if (isDbNumber(data))
      return (BigInt(data.high)*BIGINT_SEPARATOR + BigInt(data.low)).toString();
    return JSON.stringify(data);
  }
  function nodeDataToValue(data) {
    if (isDbNumber(data))
      return (BigInt(data.high)*BIGINT_SEPARATOR + BigInt(data.low)).toString();
    if (data === undefined)
      return "undefined";
    if (typeof data === "string")
      return data;
    return JSON.stringify(data);
  }
  function stringToNodeData(str) {
    if (str === "")
      return undefined;
    if (str.match(/^[+-]?\d+$/g)) {
      const nb = BigInt(str);
      return {
        low: Number(nb % BIGINT_SEPARATOR),
        high: Number(nb / BIGINT_SEPARATOR)
      };
    }
    return JSON.parse(str);
  }
  function nodeDataToCell(data): NodeCell {
    const dataString = nodeDataToString(data);
    return {
      value: data,
      currentValue: data,
      lastValue: dataString,
      nextValue: dataString
    }
  }

  type NodeCell = {
    currentValue: any; // Current value in database
    value: any; // Value changed
    lastValue: string; // Last value before starting editing
    nextValue: string; // Current value editing
    editing?: boolean; // Is currently editing cell
    edited?: boolean; // Has cell been edited
    input?: HTMLInputElement
  }
  type NodeRow = {
    cells: Record<string, NodeCell>;
    _fields: NodeResult<any>[];
  };
  type NodeCol = {
    key: string;
  };
  type NodeColGroup = {
    key: string;
    cols: NodeCol[];
  };

  let rows: NodeRow[] = [];
  let columns: NodeCol[] = [];
  let loadingRows = true;
  async function loadRows(params) {
    loadingRows = true;
    let cypherQuery = `MATCH (n:${params.label}) RETURN n LIMIT 50`;
    try {
      const { records } = await executeQuery<NodeResult<any>>(
        params.id,
        cypherQuery
      );
      rows = records.map((r) => {
        const cells: Record<string, NodeCell> = {};
        const { _fields } = r;
        for (let i = 0; i < _fields.length; i++) {
          const field = _fields[i];
          const sI = `${i}`;
          cells[propsToKey([sI, "identity"])] = nodeDataToCell(field.identity);
          let properties = field.properties;
          for (const key in properties)
            cells[propsToKey([sI, "properties", key])] = nodeDataToCell(properties[key]);
        }
        return {
          _fields,
          cells,
        };
      });
      let allColumns: Record<string, NodeCol> = {};
      for (const row of rows) {
        for (const key in row.cells) allColumns[key] = { key };
      }
      columns = Object.values(allColumns);
      loadingRows = false;
    } catch (e) {
      showError(e);
    }
  }
  function handleCellKeyPress(event,rowId,key) {
    if (event.code === "Enter")
      handleCellChange(rowId,key);
    else if (event.code === "Escape")
      handleCellExit(rowId,key);
  }
  function handleCellExit(rowId,key) {
    rows[rowId].cells[key].nextValue = rows[rowId].cells[key].lastValue;
    rows[rowId].cells[key].editing = false;
    rows = rows;
  }
  async function handleCellChange(rowId,key) {
    if (rows[rowId].cells[key].nextValue !== rows[rowId].cells[key].lastValue) {
      try {
        const nextValueParsed = stringToNodeData(rows[rowId].cells[key].nextValue);
        rows[rowId].cells[key].value = nextValueParsed;
      }
      catch (e) {
        await bootbox.alert(e.message);
        rows[rowId].cells[key].editing = true;
        postSelectRow(rowId,key);
        rows = rows;
        return;
      }
      rows[rowId].cells[key].edited = true;
      rows[rowId].cells[key].lastValue = rows[rowId].cells[key].nextValue;
    }
    rows[rowId].cells[key].editing = false;
    rows = rows;
  }
  function handleCellStartEdit(rowId,key) {
    rows[rowId].cells[key].editing = true;
    rows = rows;
    postSelectRow(rowId,key);
  }
  function postSelectRow(rowId,key) {
    setTimeout(() => {
      const row = rows[rowId].cells[key];
      const input = row.input;
      if (input) {
        const value = input.value;
        if (value.match(/^".*"$/g)) {
          input.focus();
          input.setSelectionRange(1,value.length-1);
        }
        else
          input.select();
      }
    });
  }
  $: loadRows(params);
  let columnGroups: NodeColGroup[];
  $: {
    let groups: NodeColGroup[] = [];
    let currentGroup: NodeColGroup;
    let lastKey;
    for (let column of columns) {
      let props = keyToProps(column.key);
      let propsForGroup = props.slice(0, props.length - 1);
      let key = propsToKey(propsForGroup);
      if (key !== lastKey) {
        lastKey = key;
        currentGroup = {
          key,
          cols: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.cols.push(column);
    }
    columnGroups = groups;
  }
  const identityKey = propsToKey(["0", "identity"]);

  document.title = params.label;
</script>

<main class="Connection">
  <h1>{params.label}</h1>
  <GoBack class="mb-2" />
  {#if columns.length}
    <Table class="query-result-table">
      <thead>
        <tr>
          {#each columnGroups as columnGroup}
            <th colspan={columnGroup.cols.length}>{columnGroup.key}</th>
          {/each}
        </tr>
        <tr>
          {#each columns as column (column.key)}
            <th>{lastKey(column.key)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row,i (row.cells[identityKey])}
          <tr>
            {#each columns as column (column.key)}
              <td class:cell-edited={row.cells[column.key].edited}>
                {#if row.cells[column.key].editing}
                  <div class="cell-edit">
                    <input type="text" bind:this={row.cells[column.key].input} bind:value={row.cells[column.key].nextValue} on:keydown={(event) => handleCellKeyPress(event,i,column.key)} on:blur={() => handleCellChange(i,column.key)} />
                  </div>
                {:else}
                  <div class="cell-view" on:dblclick={() => handleCellStartEdit(i,column.key)}>
                    {nodeDataToValue(row.cells[column.key].value)}
                  </div>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </Table>
  {/if}
</main>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  $cell-outer-color: $gray-600;
  $cell-inner-color: $gray-400;

  :global(.table.query-result-table) {
    width: auto;
    font-size: 0.75em;
    margin-right: 0.25em;
    & > thead > tr > th {
      text-align: center;
      padding: 0.375em;
      border: 1px solid $cell-outer-color;
    }
    & > tbody > tr {
      & > td {
        padding: 0;
        border: 1px solid $cell-inner-color;
        cursor: default;
        &.cell-edited {
          border-color: $blue-300;
          background-color: $blue-100;
        }
        > .cell-view {

          width: 10em;
          padding: 0.5em;
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
        }
        > .cell-edit > input {
          width: 10em;
          padding: 0.5em;
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
        }
      }
      &:last-child > td {
        border-bottom: 1px solid $cell-outer-color;
      }
      & > td:first-child {
        border-left: 1px solid $cell-outer-color;
      }
      & > td:last-child {
        border-right: 1px solid $cell-outer-color;
      }
    }
  }
</style>
