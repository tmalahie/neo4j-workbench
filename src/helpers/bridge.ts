if (!window.require) window.require = (() => ({})) as any;
export const { ipcRenderer } = window.require("electron");
import { v4 as uuid } from "uuid";

export const sendData = ipcRenderer ? <T>(action, payload): Promise<T> => {
  const key = uuid();
  const actionKey = `${action}.${key}`;
  return new Promise((resolve, reject) => {
    function onSuccess(_event: any, response: T) {
      removeEvents();
      resolve(response);
    }
    function onError(_event: any, response: T) {
      removeEvents();
      reject(response);
    }
    function removeEvents() {
      ipcRenderer.removeListener(`${actionKey}.success`, onSuccess);
      ipcRenderer.removeListener(`${actionKey}.error`, onError);
    }
    ipcRenderer.once(`${actionKey}.success`, onSuccess);
    ipcRenderer.once(`${actionKey}.error`, onError);
    ipcRenderer.send(action, { payload, key });
  });
} : <T>(action, payload): Promise<T> => { console.log({ action, payload }); return new Promise(() => { }) };