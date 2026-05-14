(function () {
  const LOCALE = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const IS_ZH = LOCALE === 'zh';
  const UI = {
    expand: IS_ZH ? '展开' : 'Expand',
    collapse: IS_ZH ? '收起' : 'Collapse',
    optionsLabel: IS_ZH ? '配置项' : 'options',
    noMatches: IS_ZH ? '没有匹配的配置项。' : 'No matching options.',
    packages: IS_ZH ? '个图表。' : 'packages.',
    matchingPackage: IS_ZH ? '个匹配图表。' : 'matching package.',
    matchingPackages: IS_ZH ? '个匹配图表。' : 'matching packages.'
  };
  let activeOptionCaseId = '';

  document.addEventListener('DOMContentLoaded', initializeOptionsPage);

  function initializeOptionsPage() {
    document.querySelectorAll('.option-card tbody').forEach(initializeOptionTree);
    initializeOptionSelection();
    initializeOptionSearch();
  }

  function initializeOptionTree(tbody) {
    const rowsByIndex = new Map(Array.from(tbody.rows).map((row) => [row.dataset.optionIndex, row]));
    tbody.addEventListener('click', (event) => {
      if (document.body.classList.contains('options-page--searching')) return;

      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      const toggle = target.closest('.option-toggle');
      const nameCell = target.closest('.option-table__name');
      if (!toggle && !nameCell) return;

      const row = (toggle || nameCell).closest('tr');
      if (!row || row.dataset.expanded === undefined) return;
      toggleOptionRow(row, rowsByIndex);
    });
  }

  function toggleOptionRow(row, rowsByIndex) {
    const expanded = row.dataset.expanded !== 'true';
    setOptionRowExpanded(row, expanded);
    if (expanded) {
      showDirectChildren(row, rowsByIndex);
    } else {
      collapseDescendants(row, rowsByIndex);
    }
  }

  function showDirectChildren(row, rowsByIndex) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      child.hidden = false;
      if (child.dataset.expanded === 'true') showDirectChildren(child, rowsByIndex);
    });
  }

  function collapseDescendants(row, rowsByIndex) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      child.hidden = true;
      if (child.dataset.expanded !== undefined) setOptionRowExpanded(child, false);
      collapseDescendants(child, rowsByIndex);
    });
  }

  function getDirectChildren(row, rowsByIndex) {
    return (row.dataset.childIndexes || '')
      .split(',')
      .filter(Boolean)
      .map((index) => rowsByIndex.get(index))
      .filter(Boolean);
  }

  function setOptionRowExpanded(row, expanded) {
    row.dataset.expanded = expanded ? 'true' : 'false';
    const toggle = row.querySelector('.option-toggle');
    if (!toggle) return;
    toggle.textContent = expanded ? '-' : '+';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.setAttribute('aria-label', formatToggleLabel(expanded, row.dataset.optionName));
  }

  function initializeOptionSearch() {
    const inputs = Array.from(document.querySelectorAll('[data-options-search-input]'))
      .filter((input) => input instanceof HTMLInputElement);
    const clearButtons = Array.from(document.querySelectorAll('[data-options-search-clear]'))
      .filter((button) => button instanceof HTMLButtonElement);
    if (!inputs.length) return;

    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        syncSearchControls(input.value, input);
        applyOptionSearch(input.value);
      });
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !input.value) return;
        syncSearchControls('', input);
        applyOptionSearch('');
      });
    });

    clearButtons.forEach((clear) => {
      clear.addEventListener('click', () => {
        syncSearchControls('');
        applyOptionSearch('');
        getActiveSearchInput()?.focus();
      });
    });

    syncSearchControls(inputs[0].value, inputs[0]);
    applyOptionSearch(inputs[0].value);
  }

  function syncSearchControls(value, sourceInput) {
    document.querySelectorAll('[data-options-search-input]').forEach((input) => {
      if (!(input instanceof HTMLInputElement) || input === sourceInput) return;
      input.value = value;
    });
    if (sourceInput) sourceInput.value = value;
  }

  function getActiveSearchInput() {
    const activeCard = activeOptionCaseId ? document.getElementById(activeOptionCaseId) : null;
    const input = activeCard?.querySelector('[data-options-search-input]');
    return input instanceof HTMLInputElement ? input : null;
  }

  function focusActiveSearchInput() {
    const input = getActiveSearchInput();
    if (!input) return;
    input.focus();
    const cursor = input.value.length;
    input.setSelectionRange(cursor, cursor);
  }

  function initializeOptionSelection() {
    const nav = document.getElementById('options-nav');
    if (!nav) return;

    nav.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      const link = target ? target.closest('[data-option-target]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hidden) return;

      event.preventDefault();
      selectOptionCase(link.dataset.optionTarget, { updateHash: true });
    });

    window.addEventListener('hashchange', () => {
      const hashId = getHashOptionCaseId();
      if (hashId) selectOptionCase(hashId, { updateHash: false });
    });

    activeOptionCaseId = getHashOptionCaseId() || getFirstSelectableOptionCaseId();
    applyActiveOptionCase();
  }

  function applyOptionSearch(rawQuery) {
    const query = normalizeSearchText(rawQuery);
    const searching = Boolean(query);
    const searchHadFocus = document.activeElement instanceof HTMLInputElement
      && document.activeElement.matches('[data-options-search-input]');
    const cards = Array.from(document.querySelectorAll('.option-card'));
    let visibleCards = 0;
    let directMatches = 0;
    let packageMatches = 0;

    const selectableIds = [];

    cards.forEach((card) => {
      const stats = searching ? filterOptionCard(card, query) : restoreOptionCard(card);
      visibleCards += stats.visible ? 1 : 0;
      directMatches += stats.matches;
      packageMatches += stats.packageMatch ? 1 : 0;
      card.dataset.searchVisible = stats.visible ? 'true' : 'false';
      if (stats.visible) selectableIds.push(card.id);
      const navLink = document.querySelector(`[data-option-target="${card.id}"]`);
      if (navLink) navLink.hidden = !stats.visible;
    });

    const hasSearchResults = selectableIds.length > 0;
    document.body.classList.toggle('options-page--searching', searching);
    document.body.classList.toggle('options-page--empty-search', searching && !hasSearchResults);

    if (!selectableIds.includes(activeOptionCaseId)) {
      activeOptionCaseId = selectableIds[0] || activeOptionCaseId || getFirstSelectableOptionCaseId();
    }
    applyActiveOptionCase();
    if (searchHadFocus) focusActiveSearchInput();
    updateSearchStatus(searching, directMatches, packageMatches, visibleCards, cards.length);
  }

  function filterOptionCard(card, query) {
    const rows = Array.from(card.querySelectorAll('tbody tr'));
    const rowsByIndex = new Map(rows.map((row) => [row.dataset.optionIndex, row]));
    const visibleIndexes = new Set();
    const matchIndexes = new Set();
    const cardMatches = (card.dataset.searchText || '').includes(query);

    rows.forEach((row) => {
      if ((row.dataset.searchText || '').includes(query)) {
        matchIndexes.add(row.dataset.optionIndex);
        includeSearchContext(row, rowsByIndex, visibleIndexes);
      }
    });

    const packageMatch = cardMatches && !matchIndexes.size;
    if (packageMatch) {
      rows.forEach((row) => {
        if (!row.dataset.parentIndex) visibleIndexes.add(row.dataset.optionIndex);
      });
    }

    rows.forEach((row) => {
      row.hidden = !visibleIndexes.has(row.dataset.optionIndex);
      row.classList.toggle('option-table__row--search-match', matchIndexes.has(row.dataset.optionIndex));
      const toggle = row.querySelector('.option-toggle');
      if (toggle) toggle.disabled = true;
    });

    const visible = visibleIndexes.size > 0;
    return { visible, matches: matchIndexes.size, packageMatch };
  }

  function restoreOptionCard(card) {
    const rows = Array.from(card.querySelectorAll('tbody tr'));
    const rowsByIndex = new Map(rows.map((row) => [row.dataset.optionIndex, row]));

    rows.forEach((row) => {
      row.hidden = row.dataset.parentIndex ? !areAncestorsExpanded(row, rowsByIndex) : false;
      row.classList.remove('option-table__row--search-match');
      const toggle = row.querySelector('.option-toggle');
      if (toggle) toggle.disabled = false;
    });

    return { visible: true, matches: 0, packageMatch: false };
  }

  function includeSearchContext(row, rowsByIndex, visibleIndexes) {
    visibleIndexes.add(row.dataset.optionIndex);
    includeAncestors(row, rowsByIndex, visibleIndexes);
    includeDescendants(row, rowsByIndex, visibleIndexes);
  }

  function includeAncestors(row, rowsByIndex, visibleIndexes) {
    let parent = rowsByIndex.get(row.dataset.parentIndex);
    while (parent) {
      visibleIndexes.add(parent.dataset.optionIndex);
      parent = rowsByIndex.get(parent.dataset.parentIndex);
    }
  }

  function includeDescendants(row, rowsByIndex, visibleIndexes) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      visibleIndexes.add(child.dataset.optionIndex);
      includeDescendants(child, rowsByIndex, visibleIndexes);
    });
  }

  function areAncestorsExpanded(row, rowsByIndex) {
    let parent = rowsByIndex.get(row.dataset.parentIndex);
    while (parent) {
      if (parent.dataset.expanded !== 'true') return false;
      parent = rowsByIndex.get(parent.dataset.parentIndex);
    }
    return true;
  }

  function updateSearchStatus(searching, matches, packageMatches, visibleCards, totalCards) {
    const statuses = document.querySelectorAll('.options-search__status');
    if (!statuses.length) return;

    let message = '';
    if (!searching) {
      message = IS_ZH ? `${totalCards} ${UI.packages}` : `${totalCards} ${UI.packages}`;
    } else if (!matches && !visibleCards) {
      message = UI.noMatches;
    } else if (!matches && packageMatches) {
      message = IS_ZH
        ? `${packageMatches} ${UI.matchingPackages}`
        : `${packageMatches} ${packageMatches === 1 ? UI.matchingPackage : UI.matchingPackages}`;
    } else {
      message = IS_ZH
        ? `${visibleCards} 个图表中有 ${matches} 个匹配配置项。`
        : `${matches} matching options in ${visibleCards} packages.`;
    }

    statuses.forEach((status) => {
      status.textContent = message;
    });
  }

  function selectOptionCase(optionCaseId, { updateHash = false } = {}) {
    const card = document.getElementById(optionCaseId);
    if (!card || card.dataset.searchVisible === 'false') return;

    activeOptionCaseId = optionCaseId;
    if (updateHash && window.location.hash !== `#${optionCaseId}`) {
      window.history.pushState(null, '', `#${optionCaseId}`);
    }
    applyActiveOptionCase();
  }

  function applyActiveOptionCase() {
    const cards = Array.from(document.querySelectorAll('.option-card'));
    const showEmptySearchCard = document.body.classList.contains('options-page--empty-search');
    if (!activeOptionCaseId) {
      cards.forEach((card) => {
        card.hidden = true;
      });
      updateActiveNavLink('');
      updateLanguageSwitchLinks('');
      return;
    }

    cards.forEach((card) => {
      card.hidden = card.id !== activeOptionCaseId || (!showEmptySearchCard && card.dataset.searchVisible === 'false');
    });
    updateActiveNavLink(activeOptionCaseId);
    updateLanguageSwitchLinks(activeOptionCaseId);
  }

  function updateActiveNavLink(optionCaseId) {
    document.querySelectorAll('[data-option-target]').forEach((link) => {
      const active = link.dataset.optionTarget === optionCaseId;
      link.classList.toggle('options-nav__link--active', active);
      link.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function updateLanguageSwitchLinks(optionCaseId) {
    const targetHash = optionCaseId ? `#${encodeURIComponent(optionCaseId)}` : '';
    document.querySelectorAll('.demo-links a[href]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute('href') || '';
      const baseHref = href.split('#')[0];
      if (!/options(?:\.zh)?\.html$/.test(baseHref)) return;
      link.setAttribute('href', `${baseHref}${targetHash}`);
    });
  }

  function getHashOptionCaseId() {
    const id = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
    return id && document.getElementById(id) ? id : '';
  }

  function getFirstSelectableOptionCaseId() {
    const link = Array.from(document.querySelectorAll('[data-option-target]')).find((item) => !item.hidden);
    return link?.dataset.optionTarget || document.querySelector('.option-card')?.id || '';
  }

  function formatToggleLabel(expanded, optionName) {
    return `${expanded ? UI.collapse : UI.expand} ${optionName} ${UI.optionsLabel}`;
  }

  function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
  }
})();
