<script lang="ts">
  import type { DBConnectionParams } from "@common-types/db";
  import ConnectionModal from "src/components/ConnectionModal.svelte";
  import GoBack from "src/components/GoBack.svelte";

  import { getItem, setItem } from "src/helpers/storage";

  import { Button, Icon, ListGroup, ListGroupItem, Spinner } from "sveltestrap";
  import { onMount } from "svelte";
  import Bootbox, { bootbox } from "src/components/Bootbox.svelte";

  let connections: DBConnectionParams[];
  let addingConnection = false;
  let editingConnection: DBConnectionParams;

  onMount(async () => {
    connections = await getItem<DBConnectionParams[]>("connections", []);
  });

  async function handleConnectionAdd(connection: DBConnectionParams) {
    connections = [...connections, connection];
    await setItem("connections", connections);
  }
  async function handleConnectionEdit(connection: DBConnectionParams) {
    editingConnection = connection;
  }
  async function handleConnectionUpdate(newConnection) {
    connections = connections.map((conn) =>
      conn.id === editingConnection.id ? newConnection : conn
    );
    await setItem("connections", connections);
  }
  async function handleConnectionDelete(connection: DBConnectionParams) {
    if (await bootbox.confirm(`Delete the connection "${connection.name}"?`)) {
      connections = connections.filter((conn) => conn.id !== connection.id);
      await setItem("connections", connections);
    }
  }
</script>

<main class="Connections">
  <div>
    {#if connections}
      {#each connections as connection (connection.id)}
        <ListGroup>
          <ListGroupItem
            class="d-flex justify-content-between align-items-center"
          >
            <div>{connection.name}</div>
            <div>
              <Button
                on:click={() => handleConnectionEdit(connection)}
                color="primary"><Icon name="pencil" /></Button
              >
              <Button
                on:click={() => handleConnectionDelete(connection)}
                color="danger"><Icon name="trash" /></Button
              >
            </div>
          </ListGroupItem>
        </ListGroup>
        <ConnectionModal
          connection={editingConnection}
          isOpen={editingConnection != null}
          onClose={() => (editingConnection = null)}
          onSubmit={handleConnectionUpdate}
        />
        {#if addingConnection}
          <ConnectionModal
            isOpen={addingConnection}
            onClose={() => (addingConnection = false)}
            onSubmit={handleConnectionAdd}
          />
        {/if}
      {:else}
        No connections yet
      {/each}
    {:else}
      <Spinner />
    {/if}
  </div>
  <div class="mt-2">
    <Button color="primary" on:click={() => (addingConnection = true)}
      ><Icon name="plus" /> Add connection</Button
    >
  </div>
  <GoBack />
</main>

<style lang="scss">
</style>
