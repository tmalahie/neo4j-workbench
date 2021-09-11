<script lang="ts">
  import { Accordion, AccordionItem, Icon } from "sveltestrap";
  import { link } from "svelte-spa-router";
  import connections from "src/stores/connections";
</script>

<div class="drawer">
  <Accordion>
    <a class="accordion-item accordion-single" href="/" use:link
      ><Icon name="house-door" /> Home</a
    >
    <AccordionItem header="Connections">
      {#each $connections as connection}
        <a href={`/connections/${connection.id}`} use:link
          ><Icon name="box" /> {connection.name}</a
        >
      {/each}
    </AccordionItem>
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
