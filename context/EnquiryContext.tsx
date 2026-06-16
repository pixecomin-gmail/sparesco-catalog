"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type EnquiryItem = {
  handle: string;
  title: string;
  brand: string;
  category: string;
  quantity: number;
};

type EnquiryContextType = {
  items: EnquiryItem[];
  hasLoaded: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<EnquiryItem, "quantity">) => void;
  removeItem: (handle: string) => void;
  increaseQty: (handle: string) => void;
  decreaseQty: (handle: string) => void;
};

const STORAGE_KEY = "sparesco_enquiry_items";

const EnquiryContext = createContext<EnquiryContextType | null>(null);

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (savedItems) {
        setItems(JSON.parse(savedItems));
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function openDrawer() {
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  function addItem(item: Omit<EnquiryItem, "quantity">) {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) => currentItem.handle === item.handle
      );

      if (existingItem) {
        return currentItems.map((currentItem) =>
          currentItem.handle === item.handle
            ? { ...currentItem, quantity: currentItem.quantity + 1 }
            : currentItem
        );
      }

      return [...currentItems, { ...item, quantity: 1 }];
    });

    openDrawer();
  }

  function removeItem(handle: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.handle !== handle)
    );
  }

  function increaseQty(handle: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.handle === handle
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQty(handle: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.handle === handle
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  }

  return (
    <EnquiryContext.Provider
      value={{
        items,
        hasLoaded,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        removeItem,
        increaseQty,
        decreaseQty,
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);

  if (!context) {
    throw new Error("useEnquiry must be used inside EnquiryProvider");
  }

  return context;
}