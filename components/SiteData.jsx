'use client';

import { createContext, useContext } from 'react';

const SiteDataContext = createContext({
  categories: [],
  footer: null,
});

export function SiteDataProvider({ categories = [], footer = null, children }) {
  return (
    <SiteDataContext.Provider value={{ categories, footer }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}

