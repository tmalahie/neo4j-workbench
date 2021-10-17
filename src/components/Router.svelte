<script lang="ts">
  import { currentTab, Tab, tabs } from "src/stores/tabs";

  import type { SvelteComponent } from "svelte";

  type ComponentWithParams = {
    view: typeof SvelteComponent;
    tab: Tab;
    params: Record<string, string>;
  };

  const urlParamRegex = /\:(\w+)/g;
  const urlWildcardRegex = /\*/g;
  function findComponentsByTab(tabs: Tab[]) {
    const res = tabs.map((tab) => findComponentByTab(tab));
    return res;
  }
  function findComponentByTab(tab: Tab): ComponentWithParams {
    const component = components?.find((c) => c.tab.id === tab.id);
    if (component) return component;
    const hashPos = tab.url.lastIndexOf("#");
    const hash = hashPos === -1 ? "/" : tab.url.substring(hashPos + 1);
    for (const pattern in routes) {
      const paramIds = [null];
      const regex = new RegExp(
        "^" +
          pattern
            .replace(urlParamRegex, (param) => {
              paramIds.push(param.substring(1));
              return "([^/]+?)";
            })
            .replace(urlWildcardRegex, ".*?") +
          "$"
      );
      const paramValues = hash.match(regex);
      if (paramValues) {
        let params = {};
        for (let i = 1; i < paramIds.length; i++)
          params[paramIds[i]] = paramValues[i];
        return {
          view: routes[pattern],
          tab,
          params,
        };
      }
    }
  }

  export let routes: Record<string, typeof SvelteComponent>;
  $: components = findComponentsByTab($tabs);
</script>

{#each components as component (component.tab.id)}
  <div class:hidden={component.tab.id != $currentTab.id}>
    <svelte:component
      this={component.view}
      params={component.params}
      currentTab={component.tab}
    />
  </div>
{/each}

<style lang="scss">
  div {
    height: 100%;
  }
  .hidden {
    display: none;
  }
</style>
