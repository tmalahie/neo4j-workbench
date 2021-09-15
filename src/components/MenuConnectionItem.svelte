<script lang="ts">
  import { AccordionItem, Icon, Spinner } from "sveltestrap";
  import { link } from "svelte-spa-router";
  import type { DBConnectionParams } from "@common-types/db";
  import { executeQuery } from "src/helpers/db";
  import { onMount } from "svelte";
  import { showError } from "src/helpers/errors";
  export let connection: DBConnectionParams;

  let nodeLabels: string[],
    loadingLabels = false;
  function handleAccordionToggle(e: MouseEvent) {
    const $menuItem = e.target as HTMLElement;
    const $menuAccordion = ($menuItem.parentNode as HTMLElement)
      .nextElementSibling;
    loadingLabels = true;
    setTimeout(async () => {
      if ($menuAccordion?.classList.contains("show")) await loadLabels();
      loadingLabels = false;
    }, 500);
  }
  async function loadLabels() {
    try {
      const { records } = await executeQuery<string[]>(
        connection.id,
        "MATCH (n) RETURN distinct labels(n)"
      );

      nodeLabels = [
        ...new Set<string>(records.flatMap((r) => r._fields[0])),
      ].sort();
    } catch (e) {
      showError(e);
    }
  }

  let active = document.location.hash.startsWith(
    `#/connections/${connection.id}/`
  );
  onMount(() => {
    if (active) {
      loadingLabels = true;
      loadLabels().then(() => (loadingLabels = false));
    }
  });
</script>

<div class="MenuItem" on:click={handleAccordionToggle}>
  <AccordionItem header={connection.name} {active}>
    {#if nodeLabels}
      {#each nodeLabels as nodeLabel}
        <a
          href={`/connections/${connection.id}/${nodeLabel}`}
          title={nodeLabel}
          use:link><Icon name="clipboard-data" /> {nodeLabel}</a
        >
      {/each}
    {:else if loadingLabels}
      <div class="accordion-loading">
        <Spinner />
      </div>
    {/if}
  </AccordionItem>
</div>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  .MenuItem {
    :global(.accordion-item .accordion-body) {
      padding: 0;
      & > :global(a) {
        padding: 0.375em 1.25em;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 0.75em;
      }
      & > :global(a:hover) {
        background-color: $blue-100;
      }
    }
    a {
      display: block;
      color: $dark;
      text-decoration: none;
    }
    .accordion-loading {
      margin: 1em;
    }
  }
</style>
