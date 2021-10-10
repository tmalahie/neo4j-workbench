import { ipcRenderer, sendData } from "./bridge";

type ContextMenuItem = {
  label: string;
  onclick?: () => void
}
type ContextMenuData = {
  items: ContextMenuItem[]
}

function showContextMenu(data: ContextMenuData) {
  sendData("showContextMenu", {
    items: data.items.map(({ label }) => ({ label }))
  }).then(() => {
    function onItemClick(_event: any, response: { item: number }) {
      ipcRenderer.removeListener(`contextmenu.click`, onItemClick);
      data.items[response.item].onclick?.();
    }
    ipcRenderer.removeAllListeners(`contextmenu.click`);
    ipcRenderer.once(`contextmenu.click`, onItemClick);
  });
}

export default showContextMenu;