<script lang="ts">
  import GoBack from "src/components/GoBack.svelte";
  import { setTabTitle, Tab } from "src/stores/tabs";

  export let currentTab: Tab;
  setTabTitle(currentTab, "404 Not Found");
</script>

<main>
  404 not found
  <GoBack class="mt-3" />
</main>

<style lang="scss">
</style>
