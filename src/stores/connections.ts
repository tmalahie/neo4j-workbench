import { writable } from 'svelte/store';
import type { Updater } from 'svelte/store';
import { getItem, setItem } from "src/helpers/storage";
import type { DBConnectionParams } from "@common-types/db";
import { bootbox } from "bootbox-svelte";

const { subscribe, set, update } = writable<DBConnectionParams[]>([], (set) => {
  async function getConnections() {
    try {
      set(await getItem<DBConnectionParams[]>("connections", []));
    }
    catch (e) {
      bootbox.alert(`Failed to load connections: ${e?.message}`);
    }
  }
  getConnections();
});

const connections = {
  subscribe,
  set: (conns) => {
    set(conns);
    setItem("connections", conns);
  },
  update: (updater: Updater<DBConnectionParams[]>) => {
    update((conns) => {
      const newConnections = updater(conns);
      setItem("connections", newConnections);
      return newConnections;
    });
  },
};

export default connections;