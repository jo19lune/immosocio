/**
 * Utility to apply the theme to the document root and save it to localStorage.
 */
export function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'SOMBRE') {
    root.setAttribute('data-theme', 'dark');
    root.classList.remove('theme-lifestyle', 'theme-voyage', 'theme-community');
  } else if (theme === 'CLAIR') {
    root.removeAttribute('data-theme');
    root.classList.remove('theme-lifestyle', 'theme-voyage', 'theme-community');
  } else {
    // SYSTEME — follows browser preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    root.classList.remove('theme-lifestyle', 'theme-voyage', 'theme-community');
  }
  localStorage.setItem('theme', theme);
}

/**
 * Apply a color palette based on user segment
 * @param segment - User segment: 'STUDENT', 'TOURIST', 'COLOCATION', or null
 */
export function applyUserSegmentTheme(segment: string | null) {
  const root = document.documentElement;
  
  // Remove all theme classes first
  root.classList.remove('theme-lifestyle', 'theme-voyage', 'theme-community');
  root.removeAttribute('data-user-segment');

  if (!segment) return;

  let themeClass = '';
  switch (segment.toUpperCase()) {
    case 'STUDENT':
    case 'ETUDIANT':
      themeClass = 'theme-lifestyle';
      root.setAttribute('data-user-segment', 'STUDENT');
      break;
    case 'TOURIST':
    case 'TOURISTE':
      themeClass = 'theme-voyage';
      root.setAttribute('data-user-segment', 'TOURIST');
      break;
    case 'COLOCATION':
      themeClass = 'theme-community';
      root.setAttribute('data-user-segment', 'COLOCATION');
      break;
    default:
      // Default to lifestyle for PROPRIETAIRE and other roles
      themeClass = 'theme-lifestyle';
      root.setAttribute('data-user-segment', segment);
  }

  if (themeClass) {
    root.classList.add(themeClass);
  }

  // Save preference
  localStorage.setItem('userSegmentTheme', segment);
}

/**
 * Get the current active theme
 */
export function getCurrentTheme(): string {
  return localStorage.getItem('theme') || 'SYSTEME';
}

/**
 * Get the current user segment theme
 */
export function getCurrentUserSegmentTheme(): string | null {
  return localStorage.getItem('userSegmentTheme');
}

/**
 * Initializes the theme on application load.
 */
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'SYSTEME';
  const savedSegment = localStorage.getItem('userSegmentTheme');

  applyTheme(savedTheme);
  if (savedSegment) {
    applyUserSegmentTheme(savedSegment);
  }

  // Listen for system theme changes if SYSTEME is selected
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === 'SYSTEME') {
      if (e.matches) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
  });
}
