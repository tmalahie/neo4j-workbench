// Modules to control application life and create native browser window
import { app, screen, BrowserView, BrowserWindow, globalShortcut } from "electron";
import neo4jConnector, { Session } from "neo4j-driver";
import type { DBConnectionParams } from "./types/db";

import { addActionListener } from "./utils";
import { deleteItem, getItem, setItem } from "./storage";

let mainWindow: BrowserWindow, browserTabs: {
  view: BrowserView
}[] = [], currentTab = -1;
function handleResize() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const currentView = browserTabs[currentTab].view;
  currentView.setBounds({ x: 0, y: 0, width, height });
}
function handleResizeIfNecesary() {
  if (mainWindow.isMaximized())
    setTimeout(handleResize);
}
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.maximize();
  mainWindow.on('maximize', handleResizeIfNecesary);
  mainWindow.on('resize', handleResizeIfNecesary);

  // and load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000/#/loading');

  openTab('http://localhost:3000');
}
function openTab(url) {
  let browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  browserView.setAutoResize({ horizontal: true, vertical: true });
  browserView.webContents.addListener('new-window', (event, url) => {
    event.preventDefault()
    openTab(url);
  });
  browserView.webContents.loadURL(url);
  browserTabs.push({
    view: browserView
  });
  if (currentTab !== -1)
    mainWindow.removeBrowserView(browserTabs[currentTab].view);
  currentTab = browserTabs.length - 1;
  mainWindow.addBrowserView(browserView);
  handleResize();
  sendTabsData();
}
function selectTab(id) {
  if (id === currentTab) return;
  mainWindow.removeBrowserView(browserTabs[currentTab].view);
  currentTab = id;
  const browserTab = browserTabs[id];
  mainWindow.addBrowserView(browserTabs[id].view);
  sendTabsData();
}
function closeTab(id) {
  const browserTab = browserTabs[id];
  browserTabs.splice(id, 1);
  if (id === currentTab)
    mainWindow.removeBrowserView(browserTab.view);
  if (currentTab >= browserTabs.length)
    currentTab--;
  if (currentTab >= 0)
    mainWindow.addBrowserView(browserTabs[currentTab].view);
  sendTabsData();
  if (!browserTabs.length)
    mainWindow.close();
}

function getTabsData() {
  return {
    currentTab,
    tabs: browserTabs.map(tab => ({
      title: "Electron" // TODO
    }))
  };
}
function sendTabsData() {
  const tabsData = getTabsData();
  mainWindow.webContents.send("tabs", tabsData);
  for (const browserTab of browserTabs)
    browserTab.view.webContents.send("tabs", tabsData);
  return tabsData;
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

  globalShortcut.register('Control+Shift+I', () => {
    const browserTab = browserTabs[currentTab];
    if (browserTab)
      browserTab.view.webContents.openDevTools();
    return false;
  });
  globalShortcut.register('Control+W', () => {
    if (currentTab !== -1)
      closeTab(currentTab);
    return false;
  });
  globalShortcut.register('Control+T', () => {
    openTab("http://localhost:3000");
    return false;
  });
  globalShortcut.register('Control+Tab', () => {
    if (currentTab !== -1)
      selectTab((currentTab + 1) % browserTabs.length);
    return false;
  });
  globalShortcut.register('Control+Shift+Tab', () => {
    if (currentTab !== -1)
      selectTab((currentTab + browserTabs.length - 1) % browserTabs.length);
    return false;
  });
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
async function closeConnection(session?: Session) {
  try {
    await session?.close();
  }
  catch (e) {
    console.error(e);
  }
}

let sessions: Record<string, Session> = {};
addActionListener("openConnection", async ({ id }: { id: string }) => {
  closeConnection(sessions[id]);
  const dbParams = await getConnectionParams(id);
  if (dbParams)
    sessions[id] = openConnection(dbParams);
});
addActionListener("closeConnection", async ({ id }: { id: string }) => {
  closeConnection(sessions[id]);
  delete sessions[id];
});
addActionListener("executeQuery", async ({ id, query, params }) => {
  if (!sessions[id])
    sessions[id] = openConnection(await getConnectionParams(id));
  return sessions[id].run(query, params);
});

addActionListener("testConnection", async (dbParams: DBConnectionParams) => {
  const session = openConnection(dbParams);
  await session.run(
    'RETURN 1'
  );
  await session.close();
})

addActionListener("getTabs", async () => {
  return sendTabsData();
})

addActionListener("openTab", async ({ url }) => {
  openTab(url);
});
addActionListener("selectTab", async ({ id }) => {
  selectTab(id);
});
addActionListener("closeTab", async ({ id }) => {
  closeTab(id);
});

addActionListener("getItem", getItem)

addActionListener("setItem", setItem)

addActionListener("deleteItem", deleteItem)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
