<script lang="ts" context="module">
  export type NodeCell = {
    input?: HTMLInputElement;
    currentValue: any; // Current value in database
    value: any; // Value changed
    lastValue: string; // Last value before starting editing
    nextValue: string; // Current value editing
    editing?: boolean; // Is currently editing cell
    edited?: boolean; // Has cell been edited
    readOnly?: boolean; // Is the cell editable
  };
  export type NodeCellKey = {
    row: number;
    group: number;
    prop: string;
  };
  export type NodeRowGroup = {
    labels: string[];
    cells: Record<string, NodeCell>;
    _field: NodeResult<any>;
  };
  export type NodeRow = {
    deleting?: boolean;
    groups: NodeRowGroup[];
  };
  export type NodeCol = {
    group: number;
    key: string;
    name: string;
  };
  export type NodeColGroup = {
    key: string;
    name: string;
    labels: string[];
    cols: NodeCol[];
  };
  export type CypherFilters = Record<string, any>;
  export type CypherSort = {
    key: string;
    order: "DESC" | "ASC";
  };
  export type CypherPaging = {
    currentPage: number;
    isNextPage: boolean;
  };
  export type CypherQuery = {
    id?: string;
    labels?: string[];
    filters?: CypherFilters;
    sort?: CypherSort;
    paging?: CypherPaging;
  };
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

  export function getCell(row: NodeRow, column: NodeCol): NodeCell {
    return row.groups[column.group].cells[column.key];
  }
  export function setCell(row: NodeRow, column: NodeCol, value: NodeCell) {
    return (row.groups[column.group].cells[column.key] = value);
  }
  export function nodeDataToCell(data, readOnly?: boolean): NodeCell {
    const dataString = nodeDataToString(data);
    return {
      value: data,
      currentValue: data,
      lastValue: dataString,
      nextValue: dataString,
      readOnly,
    };
  }
</script>

<script lang="ts">
  import {
    executeQuery,
    nodeDataToCypherValue,
    nodeDataToString,
    nodeDataToValue,
    QueryResult,
    stringToNodeData,
  } from "src/helpers/db";

  import type { NodeResult } from "src/helpers/db";
  import Loading from "src/routes/Loading.svelte";
  import { Button, Table } from "sveltestrap";
  import { showError } from "src/helpers/errors";
  import { onMount } from "svelte";
  import QueryCell from "./QueryCell.svelte";
  import QueryCol from "./QueryCol.svelte";
  import QueryFilter from "./QueryFilter.svelte";
  import showContextMenu from "src/helpers/contextMenu";

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
  function labelsToCypherNode(labels) {
    return "n" + labels.map((label) => `:${label}`).join("");
  }
  function filterToCypherWhere(key: string, value: string) {
    let filterVar = keyToCypherNode(key);
    if ("NULL" === value) return `${filterVar} IS NULL`;
    else return `${filterVar}=${value}`;
  }
  function columnName(key) {
    const props = keyToProps(key);
    switch (props[1]) {
      case "identity":
        return "ID";
    }
    return lastKey(key);
  }

  function recordToRow(r: QueryResult<any>["records"][0]) {
    const groups: NodeRowGroup[] = [];
    const { _fields } = r;
    for (let i = 0; i < _fields.length; i++) {
      const field = _fields[i];
      const sI = `${i}`;
      const cells: Record<string, NodeCell> = {};
      cells[propsToKey([sI, "identity"])] = nodeDataToCell(
        field.identity,
        true
      );
      let properties = field.properties;
      for (const key in properties) {
        cells[propsToKey([sI, "properties", key])] = nodeDataToCell(
          properties[key]
        );
      }
      groups.push({
        labels: field.labels,
        _field: field,
        cells,
      });
    }
    return {
      groups,
    };
  }
  function fillEmptyColumns(row: NodeRow, columns: NodeCol[]) {
    for (const column of columns) {
      if (!row.groups[column.group]) {
        row.groups[column.group] = {
          labels: [],
          _field: undefined,
          cells: {},
        };
      }
      if (!getCell(row, column)) setCell(row, column, nodeDataToCell(null));
    }
    return row;
  }

  const identityKey = (group) => propsToKey([`${group}`, "identity"]);

  export let connectionId: string;
  export let initialQuery: CypherQuery;
  let query;

  const nbRowsPerPage = 50;
  let loadingRows = true;
  let rows: NodeRow[] = [];
  let addingRows: NodeRow[] = [];
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
      const newRows: NodeRow[] = records.map(recordToRow);
      let allColumns: Record<string, NodeCol> = {};
      for (const column of columns) allColumns[column.key] = { ...column };
      for (const row of newRows) {
        for (let i = 0; i < row.groups.length; i++) {
          const { cells } = row.groups[i];
          for (const key in cells) {
            const name = columnName(key);
            allColumns[key] = { group: i, key, name };
          }
        }
      }
      columns = Object.values(allColumns);
      rows = [...rows, ...newRows];
      for (const row of rows) fillEmptyColumns(row, columns);
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
  function addRow() {
    const groups: NodeRowGroup[] = [];
    for (const column of columns) {
      if (!groups[column.group]) {
        groups[column.group] = {
          _field: null,
          labels: initialQuery.labels,
          cells: {},
        };
      }
      const cell = nodeDataToCell(null);
      if (column.key === identityKey(column.group)) cell.readOnly = true;
      else cell.edited = true;
      groups[column.group].cells[column.key] = cell;
    }
    const firstCell = groups[0]?.cells[columns[1]?.key];
    if (firstCell) firstCell.editing = true;
    const newRow: NodeRow = {
      groups,
    };
    addingRows.push(newRow);
    addingRows = addingRows;
    setTimeout(() => {
      let { input } = firstCell;
      if (input) input.focus();
    });
  }
  async function saveEditingRows() {
    const promises = [];
    for (const row of rows) {
      if (row.deleting) {
        const i = 0;
        const group = row.groups[i];
        const groupIdentityKey = identityKey(i);
        const identityCell = group.cells[groupIdentityKey];
        let queryToRun = `MATCH (${labelsToCypherNode(
          group.labels
        )}) WHERE ${keyToCypherNode(groupIdentityKey)}=${nodeDataToCypherValue(
          identityCell.currentValue
        )} DETACH DELETE n`;
        promises.push(
          executeQuery(connectionId, queryToRun).then(() => {
            rows = rows.filter((r) => r !== row);
          })
        );
      } else {
        let cypherPropsToSet: Record<number, string[]> = {};
        for (const column of columns) {
          const cell = getCell(row, column);
          if (cell.edited) {
            if (!cypherPropsToSet[column.group])
              cypherPropsToSet[column.group] = [];
            cypherPropsToSet[column.group].push(
              `${keyToCypherNode(column.key)}=${nodeDataToCypherValue(
                cell.value
              )}`
            );
          }
        }
        for (const [i, propsToSet] of Object.entries(cypherPropsToSet)) {
          const group = row.groups[i];
          const groupIdentityKey = identityKey(i);
          const identityCell = group.cells[groupIdentityKey];
          let queryToRun = `MATCH (${labelsToCypherNode(
            group.labels
          )}) WHERE ${keyToCypherNode(
            groupIdentityKey
          )}=${nodeDataToCypherValue(
            identityCell.currentValue
          )} SET ${propsToSet.join(",")}`;
          promises.push(
            executeQuery(connectionId, queryToRun).then(() => {
              for (const column of columns) {
                const cell = group.cells[column.key];
                group.cells[column.key] = nodeDataToCell(
                  cell.value,
                  cell.readOnly
                );
              }
              rows = rows;
            })
          );
        }
      }
    }
    for (const row of addingRows) {
      let cypherPropsToSet: Record<number, string[]> = {};
      for (const column of columns) {
        const cell = getCell(row, column);
        if (cell.edited) {
          if (!cypherPropsToSet[column.group])
            cypherPropsToSet[column.group] = [];
          cypherPropsToSet[column.group].push(
            `${keyToCypherNode(column.key)}=${nodeDataToCypherValue(
              cell.value
            )}`
          );
        }
      }
      for (const [i, propsToSet] of Object.entries(cypherPropsToSet)) {
        const group = row.groups[i];
        let queryToRun = `CREATE (${labelsToCypherNode(group.labels)})`;
        if (propsToSet.length) queryToRun += ` SET ${propsToSet.join(",")}`;
        queryToRun += ` RETURN n`;
        promises.push(
          executeQuery<NodeResult<any>>(connectionId, queryToRun).then(
            ({ records }) => {
              addingRows = addingRows.filter((addingRow) => addingRow !== row);
              let newRows = records.map((record) => {
                return fillEmptyColumns(recordToRow(record), columns);
              });
              rows = [...newRows, ...rows];
            }
          )
        );
      }
    }
    Promise.all(promises).catch(showError);
  }
  function buildCypherQuery({
    id,
    labels,
    filters,
    sort,
    paging,
  }: CypherQuery) {
    let res = `MATCH (${labelsToCypherNode(labels)})`;
    let cypherWhere = [];
    if (id !== undefined)
      cypherWhere.push(filterToCypherWhere(identityKey(0), id));
    for (const key in filters)
      cypherWhere.push(filterToCypherWhere(key, filters[key]));
    if (cypherWhere.length) res += " WHERE " + cypherWhere.join(" AND ");
    res += " RETURN n";
    if (sort) res += ` ORDER BY ${keyToCypherNode(sort.key)} ${sort.order}`;
    res += ` SKIP ${paging.currentPage * nbRowsPerPage} LIMIT ${nbRowsPerPage}`;
    return res;
  }
  async function resetEditingRows() {
    for (const row of rows) {
      delete row.deleting;
      for (const column of columns) {
        const cell = getCell(row, column);
        setCell(row, column, nodeDataToCell(cell.currentValue, cell.readOnly));
      }
    }
    rows = rows;
    addingRows = [];
  }
  function handleSort(sort: CypherSort) {
    query.sort = sort;
    reloadRows(query);
  }
  async function handleFilter(e) {
    const elts = e.target.elements;
    const filters = {};
    for (const elt of elts) {
      if (elt.value) {
        try {
          filters[elt.name] = nodeDataToCypherValue(
            stringToNodeData(elt.value)
          );
        } catch (e) {
          filters[elt.name] = nodeDataToCypherValue(elt.value);
          elt.value = filters[elt.name];
        }
      }
    }
    query.filters = filters;
    reloadRows(query);
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
        const labels = rows[0]?.groups[+propsForGroup[0]]?.labels ?? [];
        propsForGroup[0] = labels.join(":");
        const name = propsForGroup[propsForGroup.length - 1];
        currentGroup = {
          key,
          name,
          labels,
          cols: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.cols.push(column);
    }
    columnGroups = groups;
  }
  function hasEditedSomething(rows: NodeRow[], addingRows: NodeRow[]) {
    if (addingRows.length) return true;
    for (const row of rows) {
      if (row.deleting) return true;
      for (const column of columns) {
        const cell = getCell(row, column);
        if (cell.edited) return true;
      }
    }
    return false;
  }
  $: editedSomething = hasEditedSomething(rows, addingRows);

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

  function handleInsertRows() {
    addingRows = addingRows;
  }
  function handleUpdateRows() {
    rows = rows;
  }
  function handleContextMenu(e, row: NodeRow) {
    e.preventDefault();
    showContextMenu({
      items: [
        {
          label: "View relationships",
          onclick: () => {
            window.open(
              `#/connections/${connectionId}/node/${nodeDataToValue(
                row.groups[0].cells[identityKey(0)].currentValue
              )}/relationships`
            );
          },
        },
        {
          label: "Delete row",
          onclick: () => {
            row.deleting = true;
            rows = rows;
          },
        },
      ],
    });
  }

  function handleQueryChange(initialQuery: CypherQuery) {
    query = { ...initialQuery };
    if (!query.labels) query.labels = [];
    if (!query.filters) query.filters = {};
    if (!query.sort) {
      query.sort = {
        key: identityKey(0),
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
              <th colspan={columnGroup.cols.length}>{columnGroup.name}</th>
            {/each}
          </tr>
          <tr class="query-result-columns">
            {#each columns as column (column.key)}
              <QueryCol {column} sort={query.sort} onSort={handleSort} />
            {/each}
          </tr>
          <tr>
            {#each columns as column (column.key)}
              <QueryFilter {column} />
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each addingRows as row}
            <tr>
              {#each columns as column}
                <QueryCell {row} {column} onUpdateRows={handleInsertRows} />
              {/each}
            </tr>
          {/each}
          {#each rows as row}
            <tr
              class:row-deleting={row.deleting}
              on:contextmenu={(e) => handleContextMenu(e, row)}
            >
              {#each columns as column}
                <QueryCell {row} {column} onUpdateRows={handleUpdateRows} />
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
          <div>{rows.length} row{rows.length != 1 ? "s" : ""}</div>
          {#if query.paging.isNextPage}
            <Button type="button" color="link" on:click={loadMoreRows}
              >Load more rows</Button
            >
          {:else}
            <div class="ms-4" />
          {/if}
          <Button type="button" color="info" on:click={addRow}>Add row</Button>
          <div class:d-none={!editedSomething} class="ms-2">
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
    & > thead > tr > :global(th) {
      position: relative;
      padding: 0.25rem;
      text-align: center;
      border: 1px solid $cell-outer-color;
    }
    & > tbody > tr {
      &.row-deleting {
        background-color: $danger;
        & > :global(td) {
          background-color: $danger;
        }
      }
      & > :global(td) {
        border-bottom: 1px solid $cell-outer-color;
        &:first-child {
          border-left: 1px solid $cell-outer-color;
        }
        &:last-child {
          border-right: 1px solid $cell-outer-color;
        }
      }
    }
  }

  .query-result-global-actions {
    display: flex;
    align-items: center;
  }
</style>
