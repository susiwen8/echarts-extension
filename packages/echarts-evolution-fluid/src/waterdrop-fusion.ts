export interface WaterdropFusionShape {
  cx: number;
  cy: number;
  width: number;
  height: number;
  x0?: number;
  y0?: number;
  r0?: number;
  x1?: number;
  y1?: number;
  r1?: number;
  neck: number;
  leftRadius: number;
  rightRadius: number;
  dy: number;
  curve: number;
  bridgeLength: number;
  bridgeOnly?: boolean;
}

export interface WaterdropFusionPathContext {
  moveTo(x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
}

export const DEFAULT_WATERDROP_FUSION_SHAPE: WaterdropFusionShape = {
  cx: 0,
  cy: 0,
  width: 0,
  height: 0,
  x0: 0,
  y0: 0,
  r0: 0,
  x1: 0,
  y1: 0,
  r1: 0,
  neck: 0,
  leftRadius: 0,
  rightRadius: 0,
  dy: 0,
  curve: 0.35,
  bridgeLength: 0,
  bridgeOnly: false
};

export function buildWaterdropFusionPath(ctx: WaterdropFusionPathContext, shape: WaterdropFusionShape): void {
  const r0 = shape.r0 ?? 0;
  const r1 = shape.r1 ?? 0;
  const hasCircleShape = r0 > 0 && r1 > 0;
  const defaultRadius = hasCircleShape ? 0 : shape.height / 2;
  const leftRadius = hasCircleShape ? r0 : shape.leftRadius || defaultRadius;
  const rightRadius = hasCircleShape ? r1 : shape.rightRadius || defaultRadius;
  if (leftRadius <= 0 || rightRadius <= 0) return;

  const leftCx = hasCircleShape
    ? shape.x0 ?? 0
    : shape.cx - shape.width / 2 + leftRadius;
  const rightCx = hasCircleShape
    ? shape.x1 ?? 0
    : shape.cx + shape.width / 2 - rightRadius;
  const leftCy = hasCircleShape ? shape.y0 ?? 0 : shape.cy - shape.dy / 2;
  const rightCy = hasCircleShape ? shape.y1 ?? 0 : shape.cy + shape.dy / 2;
  const vx = rightCx - leftCx;
  const vy = rightCy - leftCy;
  const dist = Math.hypot(vx, vy) || 1;
  const minRadius = Math.min(leftRadius, rightRadius);
  const maxNeck = clamp((hasCircleShape && shape.neck <= 0 ? minRadius : shape.neck) / minRadius, 0, 1);
  const bridgeLength = Math.max(shape.bridgeLength, 0);
  const gap = dist - leftRadius - rightRadius;
  const rawBridgeRate = gap <= 0
    ? 1
    : bridgeLength > 0
      ? smoothStep(1 - gap / bridgeLength)
      : 0;
  const bridgeRate = smoothStep((rawBridgeRate - 0.42) / 0.58);
  const visibleBridge = bridgeRate <= 0
    ? 0
    : 0.48 + bridgeRate * 0.52;
  const neck = maxNeck * visibleBridge;

  if (!shape.bridgeOnly) {
    ctx.moveTo(leftCx + leftRadius, leftCy);
    ctx.arc(leftCx, leftCy, leftRadius, 0, Math.PI * 2);
    ctx.moveTo(rightCx + rightRadius, rightCy);
    ctx.arc(rightCx, rightCy, rightRadius, 0, Math.PI * 2);
  }

  if (neck <= 0 || dist <= Math.abs(leftRadius - rightRadius)) return;

  const centerAngle = Math.atan2(vy, vx);
  let leftOverlap = 0;
  let rightOverlap = 0;
  if (dist < leftRadius + rightRadius) {
    leftOverlap = Math.acos(clamp(
      (leftRadius * leftRadius + dist * dist - rightRadius * rightRadius) / (2 * leftRadius * dist),
      -1,
      1
    ));
    rightOverlap = Math.acos(clamp(
      (rightRadius * rightRadius + dist * dist - leftRadius * leftRadius) / (2 * rightRadius * dist),
      -1,
      1
    ));
  }

  const tangentSpread = Math.acos(clamp((leftRadius - rightRadius) / dist, -1, 1));
  const spread = 0.2 + neck * 0.46;
  const leftSpread = leftOverlap + (tangentSpread - leftOverlap) * spread;
  const rightSpread = rightOverlap + (Math.PI - rightOverlap - tangentSpread) * spread;
  const leftTopAngle = centerAngle - leftSpread;
  const leftBottomAngle = centerAngle + leftSpread;
  const rightTopAngle = centerAngle + Math.PI + rightSpread;
  const rightBottomAngle = centerAngle + Math.PI - rightSpread;
  const leftTop = pointOnCircle(leftCx, leftCy, leftRadius, leftTopAngle);
  const leftBottom = pointOnCircle(leftCx, leftCy, leftRadius, leftBottomAngle);
  const rightTop = pointOnCircle(rightCx, rightCy, rightRadius, rightTopAngle);
  const rightBottom = pointOnCircle(rightCx, rightCy, rightRadius, rightBottomAngle);
  const span = Math.min(
    distance(leftTop.x, leftTop.y, rightTop.x, rightTop.y),
    distance(leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y)
  );
  const handle = span
    * (0.3 + clamp(shape.curve, 0, 1) * 0.35)
    * clamp(dist * 2 / (leftRadius + rightRadius), 0, 1);

  ctx.moveTo(leftTop.x, leftTop.y);
  ctx.bezierCurveTo(
    leftTop.x - Math.sin(leftTopAngle) * handle,
    leftTop.y + Math.cos(leftTopAngle) * handle,
    rightTop.x + Math.sin(rightTopAngle) * handle,
    rightTop.y - Math.cos(rightTopAngle) * handle,
    rightTop.x,
    rightTop.y
  );
  ctx.lineTo(rightBottom.x, rightBottom.y);
  ctx.bezierCurveTo(
    rightBottom.x - Math.sin(rightBottomAngle) * handle,
    rightBottom.y + Math.cos(rightBottomAngle) * handle,
    leftBottom.x + Math.sin(leftBottomAngle) * handle,
    leftBottom.y - Math.cos(leftBottomAngle) * handle,
    leftBottom.x,
    leftBottom.y
  );
  ctx.closePath();
}

function pointOnCircle(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function distance(x0: number, y0: number, x1: number, y1: number): number {
  return Math.hypot(x1 - x0, y1 - y0);
}

function smoothStep(percent: number): number {
  const value = clamp(percent, 0, 1);
  return value * value * (3 - 2 * value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
