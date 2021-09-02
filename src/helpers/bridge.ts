if (!window.require) window.require = (() => ({})) as any;
const { ipcRenderer } = window.require("electron");

export const sendData = ipcRenderer ? (action, data) => {
  return new Promise((resolve) => {
    ipcRenderer.once(action, (_event: any, response: string) => {
      resolve(response);
    });
    ipcRenderer.send(action, data);
  });
} : (action, data) => { console.log({ action, data }); return new Promise(() => { }) };