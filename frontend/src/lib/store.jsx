import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null);

  const refresh = useCallback(() => api("/api/store").then(setStore).catch(() => {}), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (store?.name) document.title = store.name;
  }, [store]);

  return <StoreContext.Provider value={{ store, refresh }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
