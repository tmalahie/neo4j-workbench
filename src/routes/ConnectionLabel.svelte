<script lang="ts">
  export let params: { id: string; label: string };
  import GoBack from "src/components/GoBack.svelte";
  import QueryViewer from "src/components/QueryViewer.svelte";

  document.title = params.label;
</script>

<main class="Connection">
  <QueryViewer
    initialQuery={{
      label: params.label,
    }}
    connectionId={params.id}
  >
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
