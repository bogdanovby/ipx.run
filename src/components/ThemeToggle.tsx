'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * A modern, micro-animated Theme Toggle component in the style of Cloudflare.
 * Supports system preferences and allows the user to pin light or dark modes.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Determine initial state based on classlist set by inline script
    const hasDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    // Avoid layout shifts or un-hydrated icons by showing a placeholder structure
    return <div className="w-9 h-9 rounded-lg border border-card-border bg-card-bg" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-card-border bg-card-bg cursor-pointer hover:bg-border-muted/50 hover:border-brand-orange/40 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-brand-orange/50 active:scale-95"
      aria-label="Toggle color theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 overflow-hidden">
        {/* Sun Icon */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        >
          <Sun className="w-4 h-4 text-brand-orange" />
        </span>

        {/* Moon Icon */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        >
          <Moon className="w-4 h-4 text-blue-400" />
        </span>
      </div>
    </button>
  );
}
