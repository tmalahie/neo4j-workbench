<script lang="ts">
  import {
    executeQuery,
    nodeDataToCypherValue,
    nodeDataToString,
    nodeDataToValue,
    stringToNodeData,
  } from "src/helpers/db";

  import type { NodeResult } from "src/helpers/db";
  import Loading from "src/routes/Loading.svelte";
  import { Button, Icon, Input, Table } from "sveltestrap";
  import { showError } from "src/helpers/errors";
  import { onMount } from "svelte";

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
  export function nodeDataToCell(data): NodeCell {
    const dataString = nodeDataToString(data);
    return {
      value: data,
      currentValue: data,
      lastValue: dataString,
      nextValue: dataString,
    };
  }
  function propsToCypherNode(props: string[]) {
    switch (props[1]) {
      case "identity":
        return "ID(n)";
      case "properties":
        if (props[2].match(/^\w+$/)) return `n.${props[2]}`;
        return `n["${props[2]}"]`;
    }
    return "NULL";
  }
  function keyToCypherNode(key: string) {
    return propsToCypherNode(keyToProps(key));
  }

  const identityKey = propsToKey(["0", "identity"]);

  type NodeCell = {
    currentValue: any; // Current value in database
    value: any; // Value changed
    lastValue: string; // Last value before starting editing
    nextValue: string; // Current value editing
    editing?: boolean; // Is currently editing cell
    edited?: boolean; // Has cell been edited
    input?: HTMLInputElement;
  };
  type NodeRow = {
    label: string;
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
  type CypherFilters = Record<string, any>;
  type CypherSort = {
    key: string;
    order: "DESC" | "ASC";
  };
  type CypherPaging = {
    currentPage: number;
    isNextPage: boolean;
  };
  type CypherQuery = {
    label: string;
    filters?: CypherFilters;
    sort?: CypherSort;
    paging?: CypherPaging;
  };
  export let connectionId: string;
  export let initialQuery: CypherQuery;
  let query;

  const nbRowsPerPage = 50;
  let loadingRows = true;
  let rows: NodeRow[] = [];
  let columns: NodeCol[] = [];
  let cypherQuery: string;
  async function loadRows(query: CypherQuery) {
    loadingRows = true;
    cypherQuery = buildCypherQuery(query);
    try {
      const { records } = await executeQuery<NodeResult<any>>(
        connectionId,
        cypherQuery
      );
      const newRows: NodeRow[] = records.map((r) => {
        const cells: Record<string, NodeCell> = {};
        const { _fields } = r;
        for (let i = 0; i < _fields.length; i++) {
          const field = _fields[i];
          const sI = `${i}`;
          cells[propsToKey([sI, "identity"])] = nodeDataToCell(field.identity);
          let properties = field.properties;
          for (const key in properties)
            cells[propsToKey([sI, "properties", key])] = nodeDataToCell(
              properties[key]
            );
        }
        return {
          label: query.label, // TODO
          _fields,
          cells,
        };
      });
      let allColumns: Record<string, NodeCol> = {};
      for (const column of columns)
        allColumns[column.key] = { key: column.key };
      for (const row of newRows) {
        for (const key in row.cells) allColumns[key] = { key };
      }
      columns = Object.values(allColumns);
      rows = [...rows, ...newRows];
      for (const row of rows) {
        for (const column of columns) {
          if (!row.cells[column.key])
            row.cells[column.key] = nodeDataToCell(null);
        }
      }
      query.paging.isNextPage = newRows.length >= nbRowsPerPage;
      loadingRows = false;
    } catch (e) {
      showError(e);
    }
  }
  async function reloadRows(query) {
    rows = [];
    query.paging.currentPage = 0;
    query.paging.isNextPage = true;
    await loadRows(query);
  }
  async function loadMoreRows() {
    query.paging.currentPage = 1;
    loadRows(query);
  }
  async function saveEditingRows() {
    const promises = [];
    for (const row of rows) {
      let cypherPropsToSet = [];
      for (const column of columns) {
        const cell = row.cells[column.key];
        if (cell.edited) {
          cypherPropsToSet.push(
            `${keyToCypherNode(column.key)}=${nodeDataToCypherValue(
              cell.value
            )}`
          );
        }
      }
      if (cypherPropsToSet.length) {
        const identityCell = row.cells[identityKey];
        let queryToRun = `MATCH (n:${row.label}) WHERE ${keyToCypherNode(
          identityKey
        )}=${nodeDataToCypherValue(
          identityCell.currentValue
        )} SET ${cypherPropsToSet.join(",")}`;
        promises.push(
          executeQuery(connectionId, queryToRun).then(() => {
            for (const column of columns)
              row.cells[column.key] = nodeDataToCell(
                row.cells[column.key].value
              );
            rows = rows;
          })
        );
      }
    }
    Promise.all(promises).catch(showError);
  }
  function buildCypherQuery({ label, filters, sort, paging }: CypherQuery) {
    let res = `MATCH (n:${label})`;
    let cypherWhere = [];
    let cypherVars = [];
    for (const key in filters) {
      let filterVar = keyToCypherNode(key);
      cypherWhere.push(`${filterVar}=${filters[key]}`);
      cypherVars.push(filters[key]);
    }
    if (cypherWhere.length) res += " WHERE " + cypherWhere.join(" AND ");
    let cypherVarsDict = {};
    for (let i = 0; i < cypherVars.length; i++) {
      const cypherVar = cypherVars[i];
      cypherVarsDict[`var${i}`] = cypherVar;
    }
    res += " RETURN n";
    if (sort) res += ` ORDER BY ${keyToCypherNode(sort.key)} ${sort.order}`;
    res += ` SKIP ${paging.currentPage * nbRowsPerPage} LIMIT ${nbRowsPerPage}`;
    return res;
  }
  async function resetEditingRows() {
    for (const row of rows) {
      for (const column of columns)
        row.cells[column.key] = nodeDataToCell(
          row.cells[column.key].currentValue
        );
    }
    rows = rows;
  }
  function handleCellKeyPress(event, rowId, key) {
    if (event.code === "Enter") handleCellChange(rowId, key);
    else if (event.code === "Escape") handleCellExit(rowId, key);
  }
  function handleCellExit(rowId, key) {
    rows[rowId].cells[key].nextValue = rows[rowId].cells[key].lastValue;
    rows[rowId].cells[key].editing = false;
    rows = rows;
  }
  async function handleCellChange(rowId, key) {
    if (rows[rowId].cells[key].nextValue !== rows[rowId].cells[key].lastValue) {
      try {
        const nextValueParsed = stringToNodeData(
          rows[rowId].cells[key].nextValue
        );
        rows[rowId].cells[key].value = nextValueParsed;
      } catch (e) {
        await showError(e);
        rows[rowId].cells[key].editing = true;
        postSelectRow(rowId, key);
        rows = rows;
        return;
      }
      rows[rowId].cells[key].edited = true;
      rows[rowId].cells[key].lastValue = rows[rowId].cells[key].nextValue;
    }
    rows[rowId].cells[key].editing = false;
    rows = rows;
  }
  function handleSort(key) {
    if (query.sort?.key === key)
      query.sort.order = query.sort.order === "DESC" ? "ASC" : "DESC";
    else query.sort.order = "ASC";
    query.sort.key = key;
    reloadRows(query);
  }
  function handleCellStartEdit(rowId, key) {
    const props = keyToProps(key);
    if (props[1] !== "identity") {
      rows[rowId].cells[key].editing = true;
      rows = rows;
      postSelectRow(rowId, key);
    }
  }
  async function handleFilter(e) {
    const elts = e.target.elements;
    const filters = {};
    for (const elt of elts) {
      if (elt.value) {
        try {
          filters[elt.name] = nodeDataToString(stringToNodeData(elt.value));
        } catch (e) {
          filters[elt.name] = nodeDataToString(elt.value);
          elt.value = filters[elt.name];
        }
      }
    }
    query.filters = filters;
    reloadRows(query);
  }
  function postSelectRow(rowId, key) {
    setTimeout(() => {
      const row = rows[rowId].cells[key];
      const input = row.input;
      if (input) {
        const value = input.value;
        if (value.match(/^".*"$/g)) {
          input.focus();
          input.setSelectionRange(1, value.length - 1);
        } else input.select();
      }
    });
  }
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
  function hasEditedSomething(rows) {
    for (const row of rows) {
      for (const column of columns) {
        const cell = row.cells[column.key];
        if (cell.edited) return true;
      }
    }
    return false;
  }
  $: editedSomething = hasEditedSomething(rows);

  function handleKeyPress(e: KeyboardEvent) {
    if (e.code === "KeyS") {
      if (e.ctrlKey || e.metaKey) saveEditingRows();
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  });

  function handleQueryChange(initialQuery: CypherQuery) {
    query = { ...initialQuery };
    if (!query.filters) query.filters = {};
    if (!query.sort) {
      query.sort = {
        key: identityKey,
        order: "DESC",
      };
    }
    if (!query.paging) {
      query.paging = {
        currentPage: 0,
        isNextPage: true,
      };
    }
    columns = [];
    reloadRows(query);
  }
  $: handleQueryChange(initialQuery);
</script>

<div class="QueryViewer">
  <div class="connection-label-top">
    <slot name="before-header" />
    <slot name="header">
      <div class="query-raw">
        {cypherQuery}
      </div>
    </slot>
    <slot name="after-header" />
    {#if columns.length}
      <form id="query-result-filter" on:submit|preventDefault={handleFilter}>
        <Button type="submit" class="d-none" />
      </form>
      <Table class="query-result-table">
        <thead>
          <tr>
            {#each columnGroups as columnGroup}
              <th colspan={columnGroup.cols.length}>{columnGroup.key}</th>
            {/each}
          </tr>
          <tr class="query-result-columns">
            {#each columns as column (column.key)}
              <th>
                <div class="query-result-column">
                  <div class="query-result-column-title">
                    {lastKey(column.key)}
                  </div>
                  <div class="query-result-column-margin" />
                </div>
                <div
                  class="query-result-sort"
                  class:query-result-sort-active={column.key ===
                    query.sort?.key}
                  on:click={() => handleSort(column.key)}
                >
                  {#if column.key !== query.sort?.key}
                    <Icon name="sort-down-alt" />
                  {:else}
                    <Icon
                      name={query.sort.order === "DESC"
                        ? "sort-alpha-up-alt"
                        : "sort-alpha-down"}
                    />
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
          <tr>
            {#each columns as column (column.key)}
              <th
                ><Input
                  name={column.key}
                  form="query-result-filter"
                  placeholder="Filter..."
                /></th
              >
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i (row.cells[identityKey])}
            <tr>
              {#each columns as column (column.key)}
                <td class:cell-edited={row.cells[column.key].edited}>
                  {#if row.cells[column.key].editing}
                    <div class="cell-edit">
                      <input
                        type="text"
                        bind:this={row.cells[column.key].input}
                        bind:value={row.cells[column.key].nextValue}
                        on:keydown={(event) =>
                          handleCellKeyPress(event, i, column.key)}
                        on:blur={() => handleCellChange(i, column.key)}
                      />
                    </div>
                  {:else}
                    <div
                      class="cell-view"
                      class:cell-view-null={row.cells[column.key].value == null}
                      on:dblclick={() => handleCellStartEdit(i, column.key)}
                    >
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
  </div>
  <div class="connection-label-bottom">
    <slot name="before-footer" />
    <slot name="footer">
      {#if loadingRows}
        <Loading />
      {:else if columns.length}
        <div class="query-result-global-actions">
          <div>{rows.length} rows</div>
          {#if query.paging.isNextPage}
            <Button type="button" color="link" on:click={loadMoreRows}
              >Load more rows</Button
            >
          {:else}
            <div class="ms-4" />
          {/if}
          <div class:d-none={!editedSomething}>
            <Button
              class="me-1"
              type="button"
              color="success"
              on:click={saveEditingRows}>Save</Button
            >
            <Button type="button" color="warning" on:click={resetEditingRows}
              >Undo</Button
            >
          </div>
        </div>
      {/if}
    </slot>
    <slot name="after-footer" />
  </div>
</div>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  $cell-outer-color: $gray-600;
  $cell-inner-color: $gray-400;

  .QueryViewer {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .connection-label-top {
    overflow: auto;
  }
  .connection-label-bottom {
    flex: 1;
    margin-top: 1em;
  }

  .query-raw {
    font-family: monospace;
    background-color: $gray-200;
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.5rem;
  }

  :global(.table.query-result-table) {
    width: auto;
    font-size: 0.75rem;
    margin-right: 0.25rem;
    & > thead > tr > th {
      text-align: center;
      padding: 0.25rem;
      border: 1px solid $cell-outer-color;
      & :global(input.form-control) {
        padding: 0.125rem 0.25rem;
        font-size: 0.625rem;
        width: 100%;
      }
    }
    & > thead > tr.query-result-columns > th {
      position: relative;
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

  .query-result-global-actions {
    display: flex;
    align-items: center;
  }
</style>
