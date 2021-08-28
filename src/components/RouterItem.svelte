<script lang="ts">
  import { Item } from "@smui/list";
  import { push } from "svelte-spa-router";

  export let href;

  function handleClick(e) {
    e.preventDefault();
    push(href);
  }
</script>

<main>
  <Item href={`#${href}`} on:click={handleClick}><slot /></Item>
</main>

<style lang="scss">
</style>
