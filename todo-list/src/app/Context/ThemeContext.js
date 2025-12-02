"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system"); // allow system as default

  // Determine real theme when theme = "system"
  const getSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

   // Always reset theme to system on load
  useEffect(() => {
    setTheme("system");            // Reset to system
    localStorage.setItem("theme", "system"); // overwrite previous value
  }, []);

  // Apply theme
  useEffect(() => {
    if (!theme) return;

    const actualTheme = theme === "system" ? getSystemTheme() : theme;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(actualTheme);

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Auto-update when OS theme changes (optional)
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const actualTheme = getSystemTheme();
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(actualTheme);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t =>
      t === "light" ? "dark" :
      t === "dark" ? "system" :
      "light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
