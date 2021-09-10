<script lang="ts">
  export let params: { id?: string } = {};

  import type { DBConnectionParams } from "@common-types/db";
  import { v4 as uuid } from "uuid";

  import { sendData } from "src/helpers/bridge";

  import { Button, FormGroup, Input } from "sveltestrap";
  import { getItem, setItem } from "src/helpers/storage";
  import GoBack, { historyBackWFallback } from "src/components/GoBack.svelte";
  import Async, { loadData } from "src/components/Async.svelte";
  import { bootbox } from "bootbox-svelte";

  let connectionPayload = loadData<DBConnectionParams>(async () => {
    if (params.id) {
      let connections = await getItem<DBConnectionParams[]>("connections", []);
      return connections.find((c) => c.id === params.id);
    }
    return {
      host: "",
      login: "",
      password: "",
      db: "",
      name: "",
    };
  });
  $: connection = $connectionPayload.data;

  let saving = false;
  async function handleSubmit() {
    const connectionParams = {
      ...connection,
      name: connection.name || `${connection.db} - ${connection.host}`,
      id: connection.id || uuid(),
    };
    saving = true;
    try {
      if (params.id) await editConnection(params.id, connectionParams);
      else await createConnection(connectionParams);
    } catch (e) {
      bootbox.alert(e.message);
    }
    historyBackWFallback();
  }
  async function createConnection(connectionParams: DBConnectionParams) {
    const connections = await getItem<DBConnectionParams[]>("connections", []);
    connections.push(connectionParams);
    await setItem("connections", connections);
  }
  async function editConnection(
    id: string,
    connectionParams: DBConnectionParams
  ) {
    let connections = await getItem<DBConnectionParams[]>("connections", []);
    connections = connections.map((conn) =>
      conn.id === params.id ? connectionParams : conn
    );
    await setItem("connections", connections);
  }
  let testing = false;
  async function testConnection() {
    testing = true;
    const res = await sendData<string>("testConnection", connection);
    bootbox.alert(res);
    testing = false;
  }
</script>

<div class="Connection">
  <h1>{params.id ? "Edit connection" : "Create new connection"}</h1>
  <Async payload={$connectionPayload}>
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
  </Async>
</div>

<style lang="scss">
</style>
