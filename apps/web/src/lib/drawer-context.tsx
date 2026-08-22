"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DrawerContextValue {
	isDrawerOpen: boolean;
	setDrawerOpen: (open: boolean) => void;
}

const DrawerContext = createContext<DrawerContextValue>({
	isDrawerOpen: false,
	setDrawerOpen: () => {},
});

export function DrawerProvider({ children }: { children: ReactNode }) {
	const [isDrawerOpen, setDrawerOpen] = useState(false);

	return (
		<DrawerContext.Provider value={{ isDrawerOpen, setDrawerOpen }}>
			{children}
		</DrawerContext.Provider>
	);
}

export function useDrawer() {
	return useContext(DrawerContext);
}
