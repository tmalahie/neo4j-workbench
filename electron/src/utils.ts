const { ipcMain } = require('electron');

export function addActionListener(action: string, listener: (data: any) => Promise<any>) {
  ipcMain.on(action, (event, data) => {
    async function executeListener() {
      const res = await listener(data);
      event.sender.send(action, res);
      console.log(`Send response for action ${action}`, res);
    }
    executeListener();
  })
}