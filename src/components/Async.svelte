<script context="module" lang="ts">
  import { onMount } from "svelte";
  import { readable } from "svelte/store";
  import Loading from "./Loading.svelte";

  export type AsyncData<T> = {
    loading: boolean;
    data?: T;
    error?: Error;
  };

  export function loadData<T>(promise: () => Promise<T>) {
    let res: AsyncData<T> = {
      loading: true,
      data: undefined as T,
      error: undefined as Error,
    };
    return readable(res, (set) => {
      onMount(async () => {
        let data, error;
        try {
          data = await promise();
        } catch (e) {
          error = e;
        }
        set({ data, error, loading: false });
      });
    });
  }
</script>

<script lang="ts">
  export let payload: AsyncData<any>;
</script>

{#if payload.error}
  <slot name="error"><Loading /></slot>
{:else if payload.loading}
  <slot name="loading"><Loading /></slot>
{:else}
  <slot />
{/if}
