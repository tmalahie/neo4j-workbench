<script lang="ts">
  import {
    Button,
    FormGroup,
    Input,
    InputGroup,
    InputGroupText,
  } from "sveltestrap";
  import { sendData } from "../helpers/bridge";

  let host = "bolt://localhost:7687",
    login = "neo4j",
    password = "admin",
    db = "neo4j";

  async function handleSubmit() {
    const res = await sendData("testConnection", { host, login, password, db });
    alert(res);
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
