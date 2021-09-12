<script lang="ts">
  export let params: { id: string; label: string };
  import GoBack from "src/components/GoBack.svelte";
</script>

<div class="Connection">
  <h1>{params.label}</h1>
</div>

<style lang="scss">
</style>
