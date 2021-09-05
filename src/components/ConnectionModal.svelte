<script lang="ts">
  import type { DBConnectionParams } from "@common-types/db";
  import { v4 as uuid } from "uuid";

  import { sendData } from "src/helpers/bridge";

  import {
    Button,
    FormGroup,
    Input,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "sveltestrap";

  export let connection: DBConnectionParams = {
    host: "",
    login: "",
    password: "",
    db: "",
    name: "",
  };

  export let isOpen: boolean;
  export let onClose: () => void;
  export let onSubmit: (connection) => void;
  function closeModal() {
    onClose();
  }
  function handleSubmit() {
    const params = {
      ...connection,
      name: connection.name || `${connection.db} - ${connection.host}`,
      id: connection.id || uuid(),
    };
    onSubmit(params);
    closeModal();
  }
  async function testConnection() {
    const res = await sendData<string>("testConnection", connection);
    alert(res);
  }

  $: prefix = `c:${uuid()}`;
</script>

<Modal {isOpen} toggle={closeModal}>
  <form on:submit|preventDefault={handleSubmit}>
    <ModalHeader
      >{connection.id
        ? "Edit connection"
        : "Create new connection"}</ModalHeader
    >
    <ModalBody>
      <FormGroup>
        <label for={`${prefix}:host`} class="d-block">Host</label>
        <Input
          type="text"
          id={`${prefix}:host`}
          bind:value={connection.host}
          placeholder="bolt://localhost:7687"
          required
        />
        <label for={`${prefix}:login`} class="d-block mt-2">Login</label>
        <Input
          type="text"
          id={`${prefix}:login`}
          bind:value={connection.login}
          placeholder="neo4j"
          required
        />
        <label for={`${prefix}:password`} class="d-block mt-2">Password</label>
        <Input
          type="password"
          id={`${prefix}:password`}
          bind:value={connection.password}
          placeholder="admin"
          required
        />
        <label for={`${prefix}:db`} class="d-block mt-2">Database</label>
        <Input
          type="text"
          id={`${prefix}:db`}
          bind:value={connection.db}
          placeholder="neo4j"
          required
        />
      </FormGroup>
      <FormGroup>
        <label for={`${prefix}:name`} class="d-block"
          >Name given to connection (optional)</label
        >
        <Input
          type="text"
          id={`${prefix}:name`}
          bind:value={connection.name}
          placeholder="Development DB"
        />
      </FormGroup>
    </ModalBody>
    <ModalFooter class="justify-content-between">
      <Button
        type="button"
        color="link"
        class="mr-auto"
        on:click={testConnection}>Test connection...</Button
      >
      <div>
        <Button type="submit" color="primary">Ok</Button>
        <Button type="button" color="secondary" on:click={closeModal}
          >Cancel</Button
        >
      </div>
    </ModalFooter>
  </form>
</Modal>

<style lang="scss">
</style>
