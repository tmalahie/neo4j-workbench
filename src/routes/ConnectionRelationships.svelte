<script lang="ts">
  export let params: { id: string; nodeId: string };
  import GoBack from "src/components/GoBack.svelte";
  import QueryViewer from "src/components/QueryViewer.svelte";

  document.title = `#${params.nodeId} - relationships`;
</script>

<main class="Connection">
  <QueryViewer
    initialQuery={{
      id: params.nodeId,
    }}
    connectionId={params.id}
  >
    <svelte:fragment slot="before-header">
      <h1>Node #{params.nodeId} - relationships</h1>
      <GoBack class="mb-2" />
    </svelte:fragment>
  </QueryViewer>
</main>

<style lang="scss">
  .Connection {
    height: 100%;
  }
</style>
