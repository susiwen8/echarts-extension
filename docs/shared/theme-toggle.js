(function () {
  const storageKey = 'echarts-extension-theme';
  const root = document.documentElement;
  const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readStoredTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : '';
    } catch {
      return '';
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }

  function resolveTheme() {
    return readStoredTheme() || (mediaQuery && mediaQuery.matches ? 'dark' : 'light');
  }

  function isChinesePage() {
    return root.lang.toLowerCase().startsWith('zh');
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      const isDark = theme === 'dark';
      const zh = isChinesePage();
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', zh
        ? isDark ? '切换到浅色模式' : '切换到深色模式'
        : isDark ? 'Switch to light mode' : 'Switch to dark mode');
      button.textContent = zh
        ? isDark ? '深色' : '浅色'
        : isDark ? 'Dark' : 'Light';
    });
  }

  function createThemeToggle() {
    document.querySelectorAll('.demo-links').forEach((links) => {
      if (links.querySelector('.theme-toggle')) return;
      const button = document.createElement('button');
      button.className = 'theme-toggle';
      button.type = 'button';
      button.addEventListener('click', () => {
        const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        writeStoredTheme(nextTheme);
        applyTheme(nextTheme);
      });
      links.appendChild(button);
    });
    applyTheme(resolveTheme());
  }

  applyTheme(resolveTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createThemeToggle, { once: true });
  } else {
    createThemeToggle();
  }

  mediaQuery?.addEventListener('change', () => {
    if (!readStoredTheme()) applyTheme(resolveTheme());
  });
})();
