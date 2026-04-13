/**
 * Utility to apply the theme to the document root and save it to localStorage.
 */
export function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'SOMBRE') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'CLAIR') {
    root.removeAttribute('data-theme');
  } else {
    // SYSTEME — follows browser preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
}

/**
 * Initializes the theme on application load.
 */
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'SYSTEME';
  applyTheme(savedTheme);

  // Listen for system theme changes if SYSTEME is selected
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === 'SYSTEME') {
      if (e.matches) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
  });
}
