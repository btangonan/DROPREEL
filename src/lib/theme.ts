// Theme management utilities

export const THEME_STORAGE_KEY = 'isDarkMode';

export const getStoredTheme = (): boolean => {
  if (typeof window === 'undefined') return false; // SSR safety
  
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme !== null ? JSON.parse(savedTheme) : false;
};

export const setStoredTheme = (isDark: boolean): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDark));
};

export const applyTheme = (isDark: boolean): void => {
  if (typeof document === 'undefined') return; // SSR safety
  
  document.documentElement.classList.toggle('dark', isDark);
};

export const initializeTheme = (): boolean => {
  const savedTheme = getStoredTheme();
  applyTheme(savedTheme);
  return savedTheme;
};

export const toggleTheme = (currentTheme: boolean): boolean => {
  const newTheme = !currentTheme;
  setStoredTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
};