<script lang="ts">
  import { Accordion, AccordionItem, Icon } from "sveltestrap";
  import connections from "src/stores/connections";
  import MenuConnectionItem from "./MenuConnectionItem.svelte";
</script>

<div class="drawer">
  <Accordion>
    <a class="accordion-item accordion-single" href="#/"
      ><Icon name="house-door" /> Home</a
    >
    <a class="accordion-item accordion-single" href="#/connections"
      ><Icon name="box" /> Connections</a
    >
    {#each $connections as connection (connection.id)}
      <MenuConnectionItem {connection} />
    {/each}
  </Accordion>
</div>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  .drawer {
    width: 10em;
    height: 100%;
    overflow-y: auto;
    :global(.accordion-item.accordion-single) {
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
</style>
