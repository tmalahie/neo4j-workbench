<script context="module" lang="ts">
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";

  type BootboxParams = {
    message: string;
  } & (
    | {
        type: "alert";
        callback?: () => void;
      }
    | {
        type: "confirm";
        callback?: (res: boolean) => void;
      }
    | {
        type: "prompt";
        defaultValue?: string;
        callback?: (res?: string) => void;
      }
  );

  const params: Writable<BootboxParams> =
    window["bootbox.params"] ?? writable(null);
  window["bootbox.params"] = params;

  export const bootbox = {
    alert: (message: string) =>
      new Promise<void>((callback) =>
        params.set({
          type: "alert",
          message,
          callback,
        })
      ),
    confirm: async (message: string) =>
      new Promise<boolean>((callback) =>
        params.set({
          type: "confirm",
          message,
          callback,
        })
      ),
    prompt: (message: string, defaultValue?: string) =>
      new Promise<string | undefined>((callback) =>
        params.set({
          type: "prompt",
          message,
          defaultValue,
          callback,
        })
      ),
  };
</script>

<script lang="ts">
  import { Button, Input, Modal, ModalBody, ModalFooter } from "sveltestrap";
  import { v4 as uuid } from "uuid";

  function handleSubmit() {
    if ($params.callback) {
      switch ($params.type) {
        case "alert":
          $params.callback();
          break;
        case "confirm":
          $params.callback(true);
          break;
        case "prompt":
          $params.callback(value);
          break;
      }
    }
    params.set(null);
  }

  function closeModal() {
    if ($params.callback) {
      switch ($params.type) {
        case "alert":
          $params.callback();
          break;
        case "confirm":
          $params.callback(false);
          break;
        case "prompt":
          $params.callback(null);
          break;
      }
    }
    params.set(null);
  }

  $: prefix = `b:${uuid()}`;
  $: value = ($params?.type === "prompt" && $params.defaultValue) ?? "";
</script>

<div>
  <Modal isOpen={$params?.type === "alert"} toggle={closeModal}>
    <ModalBody>
      {$params.message}
    </ModalBody>
    <ModalFooter>
      <Button type="submit" color="primary" on:click={handleSubmit}>Ok</Button>
    </ModalFooter>
  </Modal>
  <Modal isOpen={$params?.type === "confirm"} toggle={closeModal}>
    <ModalBody>
      {$params.message}
    </ModalBody>
    <ModalFooter>
      <Button type="submit" color="primary" on:click={handleSubmit}>Ok</Button>
      <Button type="button" color="secondary" on:click={closeModal}
        >Cancel</Button
      >
    </ModalFooter>
  </Modal>
  <Modal isOpen={$params?.type === "prompt"} toggle={closeModal}>
    <ModalBody>
      <label for="" class="d-block">{$params.message}</label>
      <Input type="text" id={`${prefix}:value`} bind:value />
    </ModalBody>
    <ModalFooter>
      <Button type="submit" color="primary" on:click={handleSubmit}>Ok</Button>
      <Button type="button" color="secondary" on:click={closeModal}
        >Cancel</Button
      >
    </ModalFooter>
  </Modal>
</div>

<style lang="scss">
</style>
