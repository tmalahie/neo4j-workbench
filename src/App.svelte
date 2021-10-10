<script lang="ts">
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import Loading from "./routes/Loading.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Connection from "./routes/Connection.svelte";
  import Connections from "./routes/Connections.svelte";
  import ConnectionLabel from "./routes/ConnectionLabel.svelte";
  import ConnectionRelationships from "./routes/ConnectionRelationships.svelte";
  import { Bootbox } from "bootbox-svelte";
  import Menu from "./components/Menu.svelte";
  import Tabs from "./components/Tabs.svelte";

  const routes = {
    "/": Home,
    "/connections": Connections,
    "/connections/new": Connection,
    "/connections/:id": Connection,
    "/connections/:id/:label": ConnectionLabel,
    "/connections/:id/node/:nodeId/relationships": ConnectionRelationships,
    "/loading": Loading,
    "*": NotFound,
  };
</script>

<main class="App">
  <Menu />
  <div class="window">
    <Tabs />
    <div class="body">
      <Router {routes} />
    </div>
    <Bootbox />
  </div>
</main>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  :global(body) {
    margin: 0;
    padding: 0;
  }
  .App {
    display: flex;
    height: 100vh;
    .window {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-x: auto;
      .body {
        flex: 1;
        padding: 1em;
        width: 100%;
        overflow-y: auto;
      }
    }
  }
</style>
