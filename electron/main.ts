// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, MenuItem } from "electron";
const contextMenu = require('electron-context-menu');
import neo4jConnector, { Session } from "neo4j-driver";
import type { DBConnectionParams } from "./types/db";

import { addActionListener } from "./utils";
import { deleteItem, getItem, setItem } from "./storage";

let mainWindow: BrowserWindow, browserTabs: {
  id: string;
  title: string;
  url: string;
}[] = [], currentTab = -1;
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + "/../../public/favicon.png",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000/');

  contextMenu({
    window: mainWindow.webContents
  });
  mainWindow.webContents.addListener('new-window', (event, url) => {
    event.preventDefault();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

async function getConnectionParams(id) {
  const connections = await getItem<DBConnectionParams[]>({ key: "connections", defaultVal: [] });
  return connections.find(connection => connection.id === id);
}
function openConnection({ host, login, password, db }: DBConnectionParams) {
  const driver = neo4jConnector.driver(host, neo4jConnector.auth.basic(login, password))
  return driver.session({
    database: db
  });
}

type DBSession = {
  params: DBConnectionParams;
  run: (query: string, params?: any) => Promise<any>
}
let sessions: Record<string, DBSession> = {};
function createSession(connectionParams) {
  let res: DBSession = {
    params: connectionParams,
    run: async (query: string, params?: any) => {
      let session: Session;
      try {
        session = openConnection(res.params);
        return await session.run(query, params);
      }
      finally {
        session?.close();
      }
    }
  };
  return res;
}
addActionListener("openConnection", async ({ id }: { id: string }) => {
  const dbParams = await getConnectionParams(id);
  if (dbParams)
    sessions[id] = createSession(dbParams);
});
addActionListener("closeConnection", async ({ id }: { id: string }) => {
  delete sessions[id];
});
addActionListener("executeQuery", async ({ id, query, params }) => {
  if (!sessions[id])
    sessions[id] = createSession(await getConnectionParams(id));
  return sessions[id].run(query, params);
});

addActionListener("testConnection", async (dbParams: DBConnectionParams) => {
  const session = createSession(dbParams);
  await session.run(
    'RETURN 1'
  );
})

addActionListener("getItem", getItem)

addActionListener("setItem", setItem)

addActionListener("deleteItem", deleteItem)

addActionListener("showContextMenu", async (data: { items: any[] }, event: Electron.IpcMainEvent) => {
  var menu = new Menu();

  for (const [i, item] of Object.entries(data.items)) {
    menu.append(new MenuItem({
      label: item.label, click: function () {
        event.sender.send(`contextmenu.click`, { item: i });
      }
    }));
  }
  menu.popup();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
