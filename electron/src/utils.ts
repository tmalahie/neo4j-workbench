const { ipcMain } = require('electron');

export function addActionListener(action: string, listener: (data: any) => Promise<any>) {
  ipcMain.on(action, (event, data) => {
    async function executeListener() {
      try {
        const res = await listener(data);
        event.sender.send(`${action}.success`, res);
        console.log(`Send response for action ${action}`, res);
      }
      catch (e) {
        event.sender.send(`${action}.error`, e);
        console.log(`Response failed for action ${action}`, e);
      }
    }
    executeListener();
  })
}