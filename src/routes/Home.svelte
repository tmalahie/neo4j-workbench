<script lang="ts">
  import { setTabTitle, Tab } from "src/stores/tabs";

  import {
    Button,
    Card,
    CardBody,
    CardText,
    CardTitle,
    Icon,
  } from "sveltestrap";

  export let currentTab: Tab;
  setTabTitle(currentTab, "Neo4j workbench");
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
          <Button color="primary" href="#/connections/new"
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
    flex-wrap: wrap;

    & :global(.card) {
      margin: 1em;
      display: inline-block;
      width: 18em;
      text-align: center;
    }
  }
</style>
