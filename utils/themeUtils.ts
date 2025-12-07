export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export const defaultTheme: Theme = {
  id: "default",
  name: "Default (Dark)",
  colors: {
    "--color-gray-750": "#2d3748",
    "--color-gray-850": "#1a202c",
    "--color-gray-950": "#0d1117",
  },
};

export const lightTheme: Theme = {
  id: "light",
  name: "Light",
  colors: {
    "--color-gray-750": "#cbd5e0", // lighter gray
    "--color-gray-850": "#f7fafc", // almost white
    "--color-gray-950": "#ffffff", // white
  }, // Note: Text colors might need adjustment if they were assumed white on dark.
  // The app uses `text-white` heavily.
  // I might need to redefine `text-white` or use a `text-primary` var if I want full light mode support.
  // Given "text-white" is a utility class, remapping it in tailwind config to a var is risky if it's used for actual white elements.
  // For now, I'll stick to Dark Mode variations for safety, or minimal Light Mode that might look "high contrast".
};

export const midnightTheme: Theme = {
  id: "midnight",
  name: "Midnight",
  colors: {
    "--color-gray-750": "#1e3a8a", // blue-900
    "--color-gray-850": "#172554", // blue-950
    "--color-gray-950": "#020617", // slate-950
  },
};

export const themes = [defaultTheme, lightTheme, midnightTheme];

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
