const svgFloatPattern = /(?<![\w.-])-?\d+\.\d+(?:e[+-]?\d+)?/gi;
const svgComparisonPrecision = 12;

export function normalizeSvgForComparison(svg: string): string {
  return svg.replace(svgFloatPattern, (rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return rawValue;

    const rounded = Number(value.toFixed(svgComparisonPrecision));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  });
}
