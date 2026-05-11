const pageLevelSelectors = new Set(['body', 'main']);

export function resolveScreenshotSelector(visualCase) {
  const chartSelector = normalizeSelector(visualCase.chartSelector);
  if (chartSelector) return chartSelector;

  const screenshotSelector = normalizeSelector(visualCase.screenshotSelector);
  if (screenshotSelector && !pageLevelSelectors.has(screenshotSelector)) {
    return screenshotSelector;
  }

  const readySelector = normalizeSelector(visualCase.readySelector);
  if (readySelector.includes('.layout-card')) return '.layout-card__visual';
  if (readySelector.includes('#chart')) return '#chart';

  return screenshotSelector || readySelector || 'body';
}

function normalizeSelector(selector) {
  return typeof selector === 'string' ? selector.trim() : '';
}
