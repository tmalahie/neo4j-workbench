if (!window.require) window.require = (() => ({})) as any;
const { ipcRenderer } = window.require("electron");

export const sendData = ipcRenderer ? <T>(action, data): Promise<T> => {
  return new Promise((resolve) => {
    ipcRenderer.once(action, (_event: any, response: T) => {
      resolve(response);
    });
    ipcRenderer.send(action, data);
  });
} : <T>(action, data): Promise<T> => { console.log({ action, data }); return new Promise(() => { }) };