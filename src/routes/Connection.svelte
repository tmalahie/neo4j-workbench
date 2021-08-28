<script lang="ts">
  import Textfield from "@smui/textfield";
  import Button from "@smui/button";

  const { ipcRenderer, remote } = require("electron");

  let host = "bolt://localhost:7687",
    login = "neo4j",
    password = "admin",
    db = "neo4j";

  function handleSubmit() {
    console.log(ipcRenderer.once);
    console.log(ipcRenderer.send);
    ipcRenderer.once("connectionReply", (_event: any, response: string) => {
      alert(response);
    });
    ipcRenderer.send("testConnection", { host, login, password, db });
  }
</script>

<div class="Connection">
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <Textfield type="text" bind:value={host} required label="Host" />
      <Textfield type="text" bind:value={login} required label="Login" />
      <Textfield
        type="password"
        bind:value={password}
        required
        label="Password"
      />
      <Textfield type="text" bind:value={db} required label="Database" />
    </div>
    <Button color="secondary" variant="raised">Test connection</Button>
  </form>
</div>

<style lang="scss">
  .form-group {
    margin-bottom: 1em;
  }
</style>
