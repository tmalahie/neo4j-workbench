<script lang="ts">
  import { sendData } from "src/helpers/bridge";
  import { onMount } from "svelte";

  const { ipcRenderer } = window.require("electron");

  import { Icon } from "sveltestrap";

  type Tab = {
    title: string;
  };
  type TabState = {
    tabs: Tab[];
    currentTab: number;
  };

  let tabs: Tab[] = [];
  let currentTab = 0;

  function openTab(url) {
    sendData("openTab", { url });
  }
  function selectTab(id) {
    sendData("selectTab", { id });
  }
  function closeTab(id: number) {
    sendData("closeTab", { id });
  }
  function handleAuxClick(e, i) {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(i);
    }
  }

  onMount(() => {
    function linkClickListener(e) {
      if (e.target.localName == "a" && e.ctrlKey) {
        const url = e.target.href;
        if (url.startsWith("http")) {
          e.preventDefault();
          e.stopPropagation();
          window.open(url, "_blank").focus();
        }
      }
    }
    document.addEventListener("click", linkClickListener, true);

    ipcRenderer.on("tabs", (_event: any, response: TabState) => {
      tabs = response.tabs;
      currentTab = response.currentTab;
    });
    sendData("setTabTitle", { title: document.title });

    const titleObserver = new MutationObserver(function (mutations) {
      sendData("setTabTitle", { title: document.title });
    });
    titleObserver.observe(document.querySelector("title"), {
      subtree: true,
      characterData: true,
      childList: true,
    });

    return () => {
      document.removeEventListener("click", linkClickListener, true);
      titleObserver.disconnect();
    };
  });
</script>

<main class="Tabs">
  {#each tabs as tab, i}
    <div
      class="tab"
      class:tab-active={i === currentTab}
      on:auxclick={(e) => handleAuxClick(e, i)}
      on:click={() => selectTab(i)}
    >
      <div class="tab-title">
        {tab.title}
      </div>
      <span on:click|stopPropagation={() => closeTab(i)}
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
