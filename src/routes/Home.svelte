<script lang="ts">
  import ConnectionModal from "../components/ConnectionModal.svelte";
  import {
    Button,
    Card,
    CardBody,
    CardText,
    CardTitle,
    Icon,
  } from "sveltestrap";
  import { getItem, setItem } from "src/helpers/storage";
  import type { DBConnectionParams } from "@common-types/db";

  let openCreateConnectionModal = false;
  async function handleConnectionAdd(connectionData) {
    const connections = await getItem<DBConnectionParams[]>("connections", []);
    connections.push(connectionData);
    await setItem("connections", connections);
  }
</script>

<main class="Home">
  <div class="welcome-container">
    <h1>Welcome to Neo4j Workbench</h1>
    <div class="card-container">
      <Card>
        <CardBody>
          <CardTitle>Create a connection</CardTitle>
          <CardText
            >Create a new Neo4j connection and start managing your database</CardText
          >
          <Button
            color="primary"
            on:click={() => (openCreateConnectionModal = true)}
            ><Icon name="plus" /> Create connection</Button
          >
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <CardTitle>Manage your connections</CardTitle>
          <CardText>Edit your already created connections</CardText>
          <Button color="primary" href="#/connections"
            ><Icon name="gear" /> Manage connections</Button
          >
        </CardBody>
      </Card>
    </div>
  </div>
  <ConnectionModal
    isOpen={openCreateConnectionModal}
    onClose={() => (openCreateConnectionModal = false)}
    onSubmit={handleConnectionAdd}
  />
</main>

<style lang="scss">
  .welcome-container {
    margin-left: 2em;
    display: inline-block;
    text-align: center;
  }
  .card-container {
    display: flex;
    justify-content: center;

    & :global(.card) {
      margin: 1em;
      display: inline-block;
      width: 18em;
      text-align: center;
    }
  }
</style>
