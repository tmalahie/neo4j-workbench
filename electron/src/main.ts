// Modules to control application life and create native browser window
import { app, BrowserWindow } from "electron";
import neo4jConnector from "neo4j-driver";
import type { DBConnectionParams } from "./types/db";
import * as storage from "electron-json-storage";

import { addActionListener } from "./utils";

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
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

addActionListener("testConnection", async ({ host, login, password, db }: DBConnectionParams) => {
  const driver = neo4jConnector.driver(host, neo4jConnector.auth.basic(login, password))
  const session = driver.session({
    database: db
  });
  await session.run(
    'RETURN 1'
  );
})

addActionListener("getItem", ({ key, defaultVal }) => new Promise((resolve, reject) => {
  storage.has(key, (error, hasKey) => {
    if (error)
      reject(error);
    resolve(hasKey);
  });
}).then((hasKey) => new Promise((resolve, reject) => {
  if (!hasKey)
    resolve(defaultVal);
  storage.get(key, (error, data) => {
    if (error)
      reject(error);
    resolve(data);
  });
})))

addActionListener("setItem", ({ key, value }) => new Promise((resolve) => {
  storage.set(key, value, () => resolve(undefined));
}))

addActionListener("deleteItem", ({ key, value }) => new Promise((resolve) => {
  storage.remove(key, () => resolve(undefined));
}))

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
