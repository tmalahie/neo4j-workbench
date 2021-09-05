import { sendData } from "./bridge";

export function getItem<T>(key, defaultVal) {
  return sendData<T>("getItem", { key, defaultVal });
}
export function setItem(key, value) {
  return sendData("setItem", { key, value });
}
export async function deleteItem(key) {
  return sendData("deleteItem", { key });
}