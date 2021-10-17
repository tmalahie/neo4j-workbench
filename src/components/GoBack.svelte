<script context="module" lang="ts">
  export function historyBackWFallback(fallbackUrl = "/") {
    const prevPage = window.location.href;

    window.history.back();

    setTimeout(() => {
      if (window.location.href == prevPage) window.location.href = fallbackUrl;
    }, 100);
  }
</script>

<script lang="ts">
  import { Icon } from "sveltestrap";
</script>

<div class={$$props.class}>
  <a
    href="/"
    on:click|preventDefault={() => historyBackWFallback()}
    class="link-primary text-decoration-none"
    ><Icon name="chevron-left" /> Back</a
  >
</div>

<style lang="scss">
</style>
