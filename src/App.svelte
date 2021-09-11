<script lang="ts">
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Connection from "./routes/Connection.svelte";
  import Connections from "./routes/Connections.svelte";
  import { Bootbox } from "bootbox-svelte";
  import Menu from "./components/Menu.svelte";

  const routes = {
    "/": Home,
    "/connections": Connections,
    "/connections/new": Connection,
    "/connections/:id": Connection,
    "*": NotFound,
  };
</script>

<main class="App">
  <Menu />
  <div class="body">
    <Router {routes} />
    <Bootbox />
  </div>
</main>

<style lang="scss">
  :global(body) {
    margin: 0;
    padding: 0;
  }
  .App {
    display: flex;
    height: 100vh;
    .body {
      flex: 1;
      padding: 1em;
      overflow-y: auto;
    }
  }
</style>
