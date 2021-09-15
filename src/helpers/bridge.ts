if (!window.require) window.require = (() => ({})) as any;
const { ipcRenderer } = window.require("electron");
import { v4 as uuid } from "uuid";

export const sendData = ipcRenderer ? <T>(action, payload): Promise<T> => {
  const key = uuid();
  const actionKey = `${action}.${key}`;
  return new Promise((resolve, reject) => {
    ipcRenderer.once(`${actionKey}.success`, (_event: any, response: T) => {
      resolve(response);
    });
    ipcRenderer.once(`${actionKey}.error`, (_event: any, response: T) => {
      reject(response);
    });
    ipcRenderer.send(action, { payload, key });
  });
} : <T>(action, payload): Promise<T> => { console.log({ action, payload }); return new Promise(() => { }) };