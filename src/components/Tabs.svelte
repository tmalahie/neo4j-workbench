<script lang="ts" context="module">
  import {
    Tab,
    tabs,
    currentTab,
    closeTab,
    openTab,
    setTabUrl,
    selectTab,
    refreshTab,
  } from "src/stores/tabs";
  export type TabState = {
    tabs: Tab[];
    currentTab: number;
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import { Icon } from "sveltestrap";

  function handleAuxClick(e, tab: Tab) {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tab);
    }
  }

  onMount(() => {
    function findLink(elt: HTMLElement) {
      if (elt.localName == "a") return elt;
      if (elt.parentNode) return findLink(elt.parentNode as HTMLElement);
      return null;
    }
    function linkClickListener(e) {
      const $link = findLink(e.target);
      if ($link) {
        const url = $link.href;
        if (url.startsWith("http")) {
          e.preventDefault();
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) {
            openTab(url, false);
          } else {
            setTabUrl($currentTab, url);
          }
        }
      }
    }
    document.addEventListener("click", linkClickListener, true);
    return () => {
      document.removeEventListener("click", linkClickListener);
    };
  });
  onMount(() => {
    function keyListener(e: KeyboardEvent) {
      const ctrlPressed = e.ctrlKey || e.metaKey;
      const shiftPressed = e.shiftKey;
      switch (e.key) {
        case "w":
          if (ctrlPressed) {
            e.preventDefault();
            closeTab($currentTab);
          }
          break;
        case "r":
          if (ctrlPressed) {
            e.preventDefault();
            refreshTab($currentTab);
          }
          break;
        case "t":
          if (ctrlPressed) {
            e.preventDefault();
            openTab("http://localhost:3000");
          }
          break;
        case "Tab":
          if (ctrlPressed) {
            e.preventDefault();
            let currentTabId = $tabs.indexOf(
              $tabs.find(({ id }) => id === $currentTab.id)
            );
            if (shiftPressed) currentTabId--;
            else currentTabId++;
            currentTabId = (currentTabId + $tabs.length) % $tabs.length;
            selectTab($tabs[currentTabId]);
          }
          break;
      }
    }
    document.addEventListener("keydown", keyListener, true);
    return () => {
      document.removeEventListener("keydown", keyListener);
    };
  });
</script>

<main class="Tabs">
  {#each $tabs as tab, i}
    <div
      class="tab"
      class:tab-active={tab.id === $currentTab.id}
      on:auxclick={(e) => handleAuxClick(e, tab)}
      on:click={() => selectTab(tab)}
    >
      <div class="tab-title">
        {tab.title}
      </div>
      <span on:click|stopPropagation={() => closeTab(tab)}
        ><Icon name="x-circle" /></span
      >
    </div>
  {/each}
  <div class="tab-new" on:click={() => openTab("http://localhost:3000")}>
    <Icon name="plus" />
  </div>
</main>

<style lang="scss">
  @import "node_modules/bootstrap/scss/functions";
  @import "node_modules/bootstrap/scss/variables";

  .Tabs {
    width: 100%;
    height: 2em;
    border-bottom: 1px solid $gray-200;
    background-color: $gray-400;
    display: flex;
    overflow: auto;
    > .tab {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      cursor: default;
      width: 8em;
      height: 100%;
      border-right: 1px solid $gray-500;
      padding: 0 0.5em;
      > .tab-title {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        user-select: none;
        font-size: 0.85em;
        padding-right: 0.2em;
      }
      :global(i) {
        font-size: 0.75em;
        &:hover {
          color: $danger;
        }
      }
      &.tab-active {
        background-color: $gray-200;
      }
    }
    > .tab-new {
      display: inline-flex;
      align-items: center;
      padding: 0 0.25em;
      &:hover {
        background-color: $gray-500;
      }
      &:active {
        background-color: $gray-600;
      }
      :global(i) {
        font-size: 1.25em;
      }
    }
  }
</style>
