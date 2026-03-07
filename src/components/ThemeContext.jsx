import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pw_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('pw_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('pw-light');
      document.documentElement.classList.remove('pw-dark');
    } else {
      document.documentElement.classList.add('pw-dark');
      document.documentElement.classList.remove('pw-light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}