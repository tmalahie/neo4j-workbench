if (!window.require) window.require = (() => ({})) as any;
const { ipcRenderer } = window.require("electron");

export const sendData = ipcRenderer ? <T>(action, data): Promise<T> => {
  return new Promise((resolve, reject) => {
    ipcRenderer.once(`${action}.success`, (_event: any, response: T) => {
      resolve(response);
    });
    ipcRenderer.once(`${action}.error`, (_event: any, response: T) => {
      reject(response);
    });
    ipcRenderer.send(action, data);
  });
} : <T>(action, data): Promise<T> => { console.log({ action, data }); return new Promise(() => { }) };