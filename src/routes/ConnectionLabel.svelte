<script lang="ts">
  import { setTabTitle, Tab } from "src/stores/tabs";
  import GoBack from "src/components/GoBack.svelte";
  import QueryViewer from "src/components/QueryViewer.svelte";

  export let params: { id: string; label: string };
  export let currentTab: Tab;

  setTabTitle(currentTab, params.label);
  const initialQuery = {
    labels: [params.label],
  };
</script>

<main class="Connection">
  <QueryViewer {initialQuery} connectionId={params.id}>
    <svelte:fragment slot="before-header">
      <h1>{params.label}</h1>
      <GoBack class="mb-2" />
    </svelte:fragment>
  </QueryViewer>
</main>

<style lang="scss">
  .Connection {
    height: 100%;
  }
</style>
