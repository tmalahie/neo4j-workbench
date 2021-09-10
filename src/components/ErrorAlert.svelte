<script lang="ts">
  import { Alert } from "sveltestrap";

  export let error: Error;
</script>

<Alert color="danger" dismissible>{error.message}</Alert>
