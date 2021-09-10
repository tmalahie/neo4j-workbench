<script lang="ts">
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import { Accordion, Icon } from "sveltestrap";
  import Connection from "./routes/Connection.svelte";
  import Connections from "./routes/Connections.svelte";
  import { Bootbox } from "bootbox-svelte";
  import { link } from "svelte-spa-router";

  const routes = {
    "/": Home,
    "/connections": Connections,
    "/connections/new": Connection,
    "/connections/:id": Connection,
    "*": NotFound,
  };
</script>

<main class="App">
  <div class="drawer">
    <Accordion>
      <a class="accordion-item" href="/" use:link
        ><Icon name="house-door" /> Home</a
      >
      <a class="accordion-item" href="/connections" use:link
        ><Icon name="box" /> Connections</a
      >
    </Accordion>
  </div>
  <div class="body">
    <Router {routes} />
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

    .drawer {
      width: 10em;
      height: 100%;
      overflow-y: auto;
      :global(.accordion-item) {
        padding: 0.5em 1em;
      }
      :global(.accordion) {
        height: 100%;
        border-right: 1px solid rgba(0, 0, 0, 0.125);
      }
      a {
        display: block;
        color: $dark;
        text-decoration: none;
      }
    }
    .body {
      flex: 1;
      padding: 1em;
      overflow-y: auto;
    }
  }
</style>
