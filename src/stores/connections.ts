import { writable } from 'svelte/store';
import type { Updater } from 'svelte/store';
import { getItem, setItem } from "src/helpers/storage";
import type { DBConnectionParams } from "@common-types/db";

const { subscribe, set, update } = writable<DBConnectionParams[]>([], (set) => {
  getItem<DBConnectionParams[]>("connections", []).then(conns => set(conns));
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