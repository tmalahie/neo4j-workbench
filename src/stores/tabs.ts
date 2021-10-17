import { writable } from 'svelte/store';
import { v4 as uuid } from "uuid";
export type Tab = {
  id: string;
  title: string;
  url: string;
};

const initialTab: Tab = {
  id: uuid(),
  title: document.location.href,
  url: document.location.href
}
export const currentTab = writable<Tab>(initialTab);
export const tabs = writable<Tab[]>([initialTab]);

let $currentTab, $tabs;
tabs.subscribe(v => $tabs = v);
currentTab.subscribe(v => $currentTab = v);

export function openTab(url, focusTab = true) {
  const newTab = {
    id: uuid(),
    title: url,
    url,
  };
  tabs.set([
    ...$tabs,
    newTab
  ]);
  if (focusTab)
    selectTab(newTab);
}
export function selectTab({ id }: Tab) {
  currentTab.set($tabs.find((tab) => tab.id === id));
}
export function closeTab({ id }: Tab) {
  if ($currentTab.id === id) {
    const currentTabId = $tabs.indexOf($tabs.find((tab) => tab.id === id));
    if (currentTabId + 1 < $tabs.length)
      currentTab.set($tabs[currentTabId + 1]);
    else if (currentTabId > 0)
      currentTab.set($tabs[currentTabId - 1]);
    else
      window.close();
  }
  const newTabs = $tabs.filter((tab) => tab.id !== id);
  tabs.set(newTabs);
}
export function setTabTitle({ id }: Tab, title: string) {
  const newTabs = $tabs.map((tab) => (tab.id !== id ? tab : { ...tab, title }));
  tabs.set(newTabs);
  if ($currentTab.id === id)
    currentTab.set(newTabs.find(tab => id === tab.id));
}
export function setTabUrl({ id }: Tab, url: string) {
  const newId = uuid();
  const newTabs = $tabs.map((tab) =>
    tab.id !== id ? tab : { ...tab, url, id: newId }
  );
  tabs.set(newTabs);
  if ($currentTab.id === id)
    currentTab.set(newTabs.find(({ id }) => id === newId));
}
export function refreshTab({ id }: Tab) {
  const newId = uuid();
  const newTabs = $tabs.map((tab) =>
    tab.id !== id ? tab : { ...tab, id: newId }
  );
  tabs.set(newTabs);
  setTimeout(() => {
    if ($currentTab.id === id)
      currentTab.set(newTabs.find(({ id }) => id === newId));
  }, 100);
}