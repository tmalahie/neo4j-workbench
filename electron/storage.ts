import * as storage from "electron-json-storage";

export const getItem = <T>({ key, defaultVal }): Promise<T> => new Promise((resolve, reject) => {
  storage.has(key, (error, hasKey) => {
    if (error)
      reject(error);
    resolve(hasKey);
  });
}).then((hasKey) => new Promise<T>((resolve, reject) => {
  if (!hasKey)
    resolve(defaultVal);
  storage.get(key, (error, data) => {
    if (error)
      reject(error);
    resolve(data as any);
  });
}));
export const setItem = ({ key, value }) => new Promise((resolve) => {
  storage.set(key, value, () => resolve(undefined));
});
export const deleteItem = ({ key, value }) => new Promise((resolve) => {
  storage.remove(key, () => resolve(undefined));
});