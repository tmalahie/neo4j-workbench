<script lang="ts">
  import { push } from "svelte-spa-router";

  export let href;

  function handleClick(e) {
    e.preventDefault();
    push(href);
  }
</script>

<main>
  <a href={`#${href}`} on:click={handleClick}><slot /></a>
</main>

<style lang="scss">
</style>
