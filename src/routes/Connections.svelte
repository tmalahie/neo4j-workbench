<script lang="ts">
  import type { DBConnectionParams } from "@common-types/db";
  import connections from "src/stores/connections";
  import GoBack from "src/components/GoBack.svelte";

  import { Button, Icon, ListGroup, ListGroupItem, Spinner } from "sveltestrap";
  import { bootbox } from "bootbox-svelte";

  async function handleConnectionDelete(connection: DBConnectionParams) {
    if (await bootbox.confirm(`Delete the connection "${connection.name}"?`)) {
      connections.update((conns) =>
        conns.filter((conn) => conn.id !== connection.id)
      );
    }
  }

  document.title = "Manage connections";
</script>

<main class="Connections">
  <div>
    {#each $connections as connection (connection.id)}
      <ListGroup>
        <ListGroupItem
          class="d-flex justify-content-between align-items-center"
        >
          <div>{connection.name}</div>
          <div>
            <Button href={`#/connections/${connection.id}`} color="primary"
              ><Icon name="pencil" /></Button
            >
            <Button
              on:click={() => handleConnectionDelete(connection)}
              color="danger"><Icon name="trash" /></Button
            >
          </div>
        </ListGroupItem>
      </ListGroup>
    {:else}
      No connections yet
    {/each}
  </div>
  <div class="mt-3">
    <div class="d-flex justify-content-between align-items-center">
      <GoBack />
      <Button color="primary" href="#/connections/new"
        ><Icon name="plus" /> Add connection</Button
      >
    </div>
  </div>
</main>

<style lang="scss">
</style>
