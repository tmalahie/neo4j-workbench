const { ipcMain } = require('electron');

export function addActionListener<T extends (data: any) => Promise<any>>(action: string, listener: T): T {
  ipcMain.on(action, (event, data) => {
    async function executeListener() {
      const actionKey = `${action}.${data.key}`;
      try {
        const res = await listener(data.payload);
        event.sender.send(`${actionKey}.success`, res);
        console.log(`Send response for action ${action}`, res);
      }
      catch (e) {
        event.sender.send(`${actionKey}.error`, e);
        console.log(`Response failed for action ${action}`, e);
      }
    }
    executeListener();
  })
  return listener;
}