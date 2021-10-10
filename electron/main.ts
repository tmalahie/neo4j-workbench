// Modules to control application life and create native browser window
import { app, screen, BrowserView, BrowserWindow, globalShortcut } from "electron";
import neo4jConnector, { Session } from "neo4j-driver";
import type { DBConnectionParams } from "./types/db";

import { addActionListener } from "./utils";
import { deleteItem, getItem, setItem } from "./storage";

let mainWindow: BrowserWindow, browserTabs: {
  view: BrowserView,
  title: string
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
    view: browserView,
    title: url
  });
  currentTab = browserTabs.length - 1;
  mainWindow.setBrowserView(browserView);
  handleResize();
  sendTabsData();
}
function selectTab(id) {
  if (id === currentTab) return;
  currentTab = id;
  mainWindow.setBrowserView(browserTabs[id].view);
  sendTabsData();
}
function closeTab(id) {
  browserTabs.splice(id, 1);
  if (currentTab >= browserTabs.length)
    currentTab--;
  if (currentTab >= 0)
    mainWindow.setBrowserView(browserTabs[currentTab].view);
  sendTabsData();
  if (!browserTabs.length)
    mainWindow.close();
}
function setTabTitle(id, title) {
  browserTabs[id].title = title;
  sendTabsData();
}

function getTabsData() {
  return {
    currentTab,
    tabs: browserTabs.map(tab => ({
      title: tab.title
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

  app.on("browser-window-focus", () => {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      const browserTab = browserTabs[currentTab];
      if (browserTab)
        browserTab.view.webContents.toggleDevTools();
    });
    globalShortcut.register('CommandOrControl+W', () => {
      if (currentTab !== -1)
        closeTab(currentTab);
    });
    globalShortcut.register('CommandOrControl+Shift+W', () => {
      mainWindow.close();
    });
    globalShortcut.register('CommandOrControl+T', () => {
      openTab("http://localhost:3000");
    });
    globalShortcut.register('CommandOrControl+Tab', () => {
      if (currentTab !== -1)
        selectTab((currentTab + 1) % browserTabs.length);
    });
    globalShortcut.register('CommandOrControl+Shift+Tab', () => {
      if (currentTab !== -1)
        selectTab((currentTab + browserTabs.length - 1) % browserTabs.length);
    });
    globalShortcut.register('CommandOrControl+R', () => {
      if (currentTab !== -1)
        browserTabs[currentTab].view.webContents.reload();
    });
    globalShortcut.register('CommandOrControl+Shift+R', () => {
      if (currentTab !== -1)
        browserTabs[currentTab].view.webContents.reloadIgnoringCache();
    });
  });
  app.on("browser-window-blur", () => {
    globalShortcut.unregisterAll();
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
addActionListener("setTabTitle", async ({ title }, { sender }) => {
  const id = browserTabs.indexOf(browserTabs.find(tab => tab.view.webContents === sender))
  if (id !== -1)
    setTabTitle(id, title);
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
