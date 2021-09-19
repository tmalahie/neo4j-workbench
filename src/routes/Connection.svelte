<script lang="ts">
  export let params: { id?: string } = {};

  import type { DBConnectionParams } from "@common-types/db";
  import { v4 as uuid } from "uuid";

  import { sendData } from "src/helpers/bridge";

  import { Button, FormGroup, Input } from "sveltestrap";
  import GoBack, { historyBackWFallback } from "src/components/GoBack.svelte";
  import { bootbox } from "bootbox-svelte";
  import connections from "src/stores/connections";
  import { closeConnection } from "src/helpers/db";

  let connection: DBConnectionParams;
  $: {
    if (params.id && !connection?.id) {
      const conn = $connections.find((c) => c.id === params.id);
      if (conn) connection = { ...conn };
    }
    if (!connection) {
      connection = {
        host: "",
        login: "",
        password: "",
        db: "",
        name: "",
      };
    }
  }

  let saving = false;
  async function handleSubmit() {
    const connectionParams = {
      ...connection,
      name: connection.name || `${connection.db} - ${connection.host}`,
      id: connection.id || uuid(),
    };
    saving = true;
    try {
      if (params.id) {
        await editConnection(params.id, connectionParams);
        closeConnection(params.id);
      } else await createConnection(connectionParams);
    } catch (e) {
      bootbox.alert(e.message);
    }
    historyBackWFallback();
  }
  function createConnection(connectionParams: DBConnectionParams) {
    connections.update((conns) => [...conns, connectionParams]);
  }
  function editConnection(id: string, connectionParams: DBConnectionParams) {
    connections.update((conns) =>
      conns.map((conn) => (conn.id === id ? connectionParams : conn))
    );
  }
  let testing = false;
  async function testConnection() {
    testing = true;
    try {
      await sendData<string>("testConnection", connection);
      bootbox.alert("Connection succeeded!");
    } catch (e) {
      bootbox.alert(`Connection failed:\n${e?.message}`);
    }
    testing = false;
  }

  document.title = "Manage connection";
</script>

<div class="Connection">
  <h1>{params.id ? "Edit connection" : "Create new connection"}</h1>
  <form on:submit|preventDefault={handleSubmit}>
    <FormGroup>
      <label for="host" class="d-block">Host</label>
      <Input
        type="text"
        id="host"
        bind:value={connection.host}
        placeholder="bolt://localhost:7687"
        required
      />
      <label for="login" class="d-block mt-2">Login</label>
      <Input
        type="text"
        id="login"
        bind:value={connection.login}
        placeholder="neo4j"
        required
      />
      <label for="password" class="d-block mt-2">Password</label>
      <Input
        type="password"
        id="password"
        bind:value={connection.password}
        placeholder="admin"
        required
      />
      <label for="db" class="d-block mt-2">Database</label>
      <Input
        type="text"
        id="db"
        bind:value={connection.db}
        placeholder="neo4j"
        required
      />
    </FormGroup>
    <FormGroup>
      <label for="name" class="d-block"
        >Name given to connection (optional)</label
      >
      <Input
        type="text"
        id="name"
        bind:value={connection.name}
        placeholder="Development DB"
      />
    </FormGroup>
    <FormGroup>
      <div class="d-flex justify-content-between align-items-center">
        <GoBack />
        <div>
          <Button
            type="button"
            color="link"
            class="mr-auto"
            disabled={testing}
            on:click={testConnection}>Test connection...</Button
          >
          <Button type="submit" color="primary" disabled={saving}>Ok</Button>
        </div>
      </div>
    </FormGroup>
  </form>
</div>

<style lang="scss">
</style>
