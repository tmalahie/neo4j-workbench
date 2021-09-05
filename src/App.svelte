<script lang="ts">
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import { Accordion, Icon } from "sveltestrap";
  import Connections from "./routes/Connections.svelte";
  import Bootbox from "./components/Bootbox.svelte";

  const routes = {
    "/": Home,
    "/connections": Connections,
    "*": NotFound,
  };
</script>

<main class="App">
  <div class="drawer">
    <Accordion>
      <a class="accordion-item" href="#/"><Icon name="house-door" /> Home</a>
      <a class="accordion-item" href="#/connection"
        ><Icon name="box" /> Connection</a
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
      width: 9em;
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
