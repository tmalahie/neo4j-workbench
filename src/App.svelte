<script lang="ts">
  import Drawer, { Content } from "@smui/drawer";
  import List, { Text } from "@smui/list";
  import Router from "svelte-spa-router";
  import Home from "./routes/Home.svelte";
  import Connection from "./routes/Connection.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import RouterItem from "./components/RouterItem.svelte";

  const routes = {
    "/": Home,
    "/connection": Connection,
    "*": NotFound,
  };
</script>

<main class="App">
  <div class="drawer-container">
    <Drawer class="drawer">
      <Content>
        <List>
          <RouterItem href="/">
            <Text>Home</Text>
          </RouterItem>
          <RouterItem href="/connection">
            <Text>Connection</Text>
          </RouterItem>
        </List>
      </Content>
    </Drawer>
  </div>
  <div class="body">
    <Router {routes} />
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

    .drawer-container {
      height: 100%;
      overflow-y: auto;

      :global(.drawer) {
        width: 8em;
      }
    }
    .body {
      flex: 1;
      padding: 1em;
      overflow-y: auto;
    }
  }
</style>
