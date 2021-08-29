<script lang="ts">
  import {
    Button,
    FormGroup,
    Input,
    InputGroup,
    InputGroupText,
  } from "sveltestrap";

  const { ipcRenderer } = require("electron");

  let host = "bolt://localhost:7687",
    login = "neo4j",
    password = "admin",
    db = "neo4j";

  function handleSubmit() {
    ipcRenderer.once("connectionReply", (_event: any, response: string) => {
      alert(response);
    });
    ipcRenderer.send("testConnection", { host, login, password, db });
  }
</script>

<div class="Connection">
  <form on:submit|preventDefault={handleSubmit}>
    <FormGroup>
      <InputGroup class="mb-2">
        <InputGroupText>Host</InputGroupText>
        <Input type="text" bind:value={host} required />
      </InputGroup>
      <InputGroup class="mt-2 mb-2">
        <InputGroupText>Login</InputGroupText>
        <Input type="text" bind:value={login} required />
      </InputGroup>
      <InputGroup class="mt-2 mb-2">
        <InputGroupText>Password</InputGroupText>
        <Input type="password" bind:value={password} required />
      </InputGroup>
      <InputGroup class="mt-2">
        <InputGroupText>Database</InputGroupText>
        <Input type="text" bind:value={db} required />
      </InputGroup>
    </FormGroup>
    <Button type="submit" color="secondary">Test connection</Button>
  </form>
</div>

<style lang="scss">
</style>
