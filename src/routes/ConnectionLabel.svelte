<script lang="ts">
  export let params: { id: string; label: string };
  import GoBack from "src/components/GoBack.svelte";
  import { executeQuery } from "src/helpers/db";
  import type { NodeResult } from "src/helpers/db";
  import { showError } from "src/helpers/errors";
  import { Table } from "sveltestrap";

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

  type NodeRow = {
    cells: Record<string, any>;
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
        const cells: Record<string, any> = {};
        const { _fields } = r;
        for (let i = 0; i < _fields.length; i++) {
          const field = _fields[i];
          const sI = `${i}`;
          cells[propsToKey([sI, "identity"])] = field.identity;
          let properties = field.properties;
          for (const key in properties) {
            cells[propsToKey([sI, "properties", key])] = properties[key];
          }
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
    console.log({ rows });
    console.log({ columns });
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
        {#each rows as row (row.cells[identityKey])}
          <tr>
            {#each columns as column (column.key)}
              <td>
                <div>
                  {JSON.stringify(row.cells[column.key])}
                </div>
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
        padding: 0.5em;
        border: 1px solid $cell-inner-color;
        cursor: default;
        > div {
          width: 10em;
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
