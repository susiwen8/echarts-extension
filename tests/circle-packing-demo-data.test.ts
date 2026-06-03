import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

import { resolveCirclePackingLayout } from '../packages/echarts-circle-packing/src/layout.ts';

function loadDemoData() {
  const window = {};
  runInNewContext(readFileSync(new URL('../docs/shared/demo-data.js', import.meta.url), 'utf8'), { window });
  return window.EChartsExtensionExamples.data;
}

test('circle packing standard demo uses a deeper hierarchy than the overview groups', () => {
  const data = loadDemoData();
  const maxDepth = measureDepth(data.circlePacking);

  assert.ok(maxDepth >= 5, `expected at least 5 hierarchy levels, got ${maxDepth}`);
});

test('circle packing standard demo gives every branch an explicit color', () => {
  const data = loadDemoData();
  const uncoloredBranches = collectUncoloredBranchNames(data.circlePacking);

  assert.deepEqual(uncoloredBranches, []);
});

test('circle packing company story demo covers incubation and acquisition events', () => {
  const data = loadDemoData();
  const events = data.circlePackingCompanyStoryEvents;
  const nodeIds = collectNodeIds(data.circlePackingCompanyStory);
  const eventIds = events.map((event: { id: string }) => event.id);
  const referencedIds = events.flatMap((event: { sources?: unknown[]; targets?: unknown[] }) => [
    ...(event.sources || []),
    ...(event.targets || [])
  ]);

  assert.equal(data.circlePackingCompanyStory.id, 'company-incubation-story');
  assert.ok(measureDepth(data.circlePackingCompanyStory) >= 4);
  assert.ok(eventIds.includes('b-spin-off'));
  assert.ok(eventIds.includes('b-acquires-c'));
  assert.ok(eventIds.includes('a-reacquires-b'));
  assert.ok(eventIds.includes('d-incubates-h-i'));
  assert.deepEqual(eventRefs(findEvent(events, 'b-team-incubates')?.sources), ['company-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'b-team-incubates')?.targets), ['b-team-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'c-team-incubates')?.sources), ['company-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'c-team-incubates')?.targets), ['c-team-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'd-team-incubates')?.sources), ['company-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'd-team-incubates')?.targets), ['d-team-a']);
  assert.equal(findEvent(events, 'b-spin-off')?.type, 'move');
  assert.deepEqual(eventRefs(findEvent(events, 'b-spin-off')?.sources), ['b-team-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'b-spin-off')?.targets), ['b-company']);
  assert.equal(findEvent(events, 'b-spin-off')?.bridge, undefined);
  assert.equal(findEvent(events, 'b-team-exits-a')?.type, 'checkpoint');
  assert.deepEqual(eventRefs(findEvent(events, 'b-team-exits-a')?.sources), []);
  assert.equal(findEvent(events, 'b-team-exits-a')?.bridge, false);
  assert.equal(findEvent(events, 'c-spin-off')?.type, 'move');
  assert.deepEqual(eventRefs(findEvent(events, 'c-spin-off')?.sources), ['c-team-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'c-spin-off')?.targets), ['c-company']);
  assert.equal(findEvent(events, 'c-spin-off')?.bridge, undefined);
  assert.equal(findEvent(events, 'c-team-exits-a')?.type, 'checkpoint');
  assert.deepEqual(eventRefs(findEvent(events, 'c-team-exits-a')?.sources), []);
  assert.deepEqual(eventRefs(findEvent(events, 'c-team-exits-a')?.targets), ['c-company']);
  assert.equal(findEvent(events, 'c-team-exits-a')?.bridge, false);
  assert.equal(findEvent(events, 'd-moves-from-a-to-b')?.type, 'move');
  assert.deepEqual(eventRefs(findEvent(events, 'd-moves-from-a-to-b')?.sources), ['d-team-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'd-moves-from-a-to-b')?.targets), ['d-unit-b']);
  assert.equal(findEvent(events, 'd-moves-from-a-to-b')?.bridge, undefined);
  assert.equal(findEvent(events, 'd-joins-b')?.type, 'checkpoint');
  assert.deepEqual(eventRefs(findEvent(events, 'd-joins-b')?.sources), []);
  assert.deepEqual(eventRefs(findEvent(events, 'd-joins-b')?.targets), ['d-unit-b']);
  assert.equal(findEvent(events, 'd-joins-b')?.bridge, false);
  assert.equal(findEvent(events, 'd-peer-with-b')?.type, 'move');
  assert.deepEqual(eventRefs(findEvent(events, 'd-peer-with-b')?.sources), ['d-unit-b-inside-a']);
  assert.deepEqual(eventRefs(findEvent(events, 'd-peer-with-b')?.targets), ['d-unit-a']);
  assert.equal(findEvent(events, 'e-splits-f-g')?.duration, 0.4);
  assert.equal(findEvent(events, 'd-incubates-h-i')?.duration, 0.6);
  assert.equal(referencedIds.filter((id) => !nodeIds.has(String(id))).length, 0);
});

test('circle packing company story starts with B and C in A before D appears', () => {
  const data = loadDemoData();
  const firstStageNames = storyNodeNamesAt(data, 0.5);
  const dIncubationNames = storyNodeNamesAt(data, 0.8);
  const bIndependent = storyLayoutAt(data, 1.1);
  const bSeparated = storyLayoutAt(data, 1.5);
  const bNearDetach = storyLayoutAt(data, 1.65);
  const bRightBeforeDetach = storyLayoutAt(data, 1.69);
  const bDetachStart = storyLayoutAt(data, 1.7);
  const bSettling = storyLayoutAt(data, 1.76);
  const bSettled = storyLayoutAt(data, 1.86);
  const bBeforeMoveStart = visibleStoryNodesAt(data, 0.99).find((node) => rawId(node) === 'b-team-a');
  const bAtMoveStart = visibleStoryNodesAt(data, 1).find((node) => rawId(node) === 'b-team-a');
  const cBeforeMoveStart = visibleStoryNodesAt(data, 0.99).find((node) => rawId(node) === 'c-team-a');
  const cAtMoveStart = visibleStoryNodesAt(data, 1).find((node) => rawId(node) === 'c-team-a');

  assert.ok(firstStageNames.includes('A 大公司'));
  assert.ok(firstStageNames.includes('B 团队'));
  assert.ok(firstStageNames.includes('C 团队'));
  assert.equal(firstStageNames.includes('D 团队'), false);
  assert.ok(dIncubationNames.includes('D 团队'));
  assert.equal(bIndependent.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/b-team-a')
    && bridge.targetId.endsWith('/b-company')
  )), false);
  assert.ok(bBeforeMoveStart);
  assert.ok(bAtMoveStart);
  assert.ok(cBeforeMoveStart);
  assert.ok(cAtMoveStart);
  assert.ok(
    nodeDistance(bBeforeMoveStart, bAtMoveStart) <= (bBeforeMoveStart?.r ?? 0) * 0.35,
    'B does not jump when D incubation completes and B move starts'
  );
  assert.ok(
    nodeDistance(cBeforeMoveStart, cAtMoveStart) <= (cBeforeMoveStart?.r ?? 0) * 0.35,
    'C does not jump when D incubation completes and B move starts'
  );
  assert.equal(bIndependent.fluid?.bridges.some((bridge) => bridge.sourceId.endsWith('/d-team-a')), false);
  assert.equal(bSeparated.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/b-team-a')
    && bridge.targetId.endsWith('/b-company')
  )), false);
  assert.equal(bSeparated.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/b-company')
  )), true);
  const bMoveBridge = bSeparated.fluid?.bridges.find((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/b-company')
  ));
  assert.equal(bMoveBridge?.path, '');
  assert.equal(bMoveBridge?.surfaceShape?.bridgeOnly, true);
  assert.deepEqual(bMoveBridge?.hiddenIds, []);
  assert.deepEqual(bMoveBridge?.opaqueIds, [bMoveBridge?.targetId]);
  assert.deepEqual(bMoveBridge?.elevatedIds, [bMoveBridge?.targetId]);
  const movingBNode = bSeparated.nodes.find((node) => node.id === bMoveBridge?.targetId);
  assert.ok(movingBNode);
  const moveBridgeTarget = findBridgeCircleNearNode(bMoveBridge?.surfaceShape, movingBNode);
  const currentA = visibleStoryNodesAt(data, 1.5).find((node) => node.name === 'A 大公司');
  assert.ok(moveBridgeTarget);
  assert.ok(currentA);
  assert.ok(Math.abs((moveBridgeTarget?.r ?? 0) - movingBNode.r) <= 0.001);
  assert.ok(Math.hypot((moveBridgeTarget?.x ?? 0) - movingBNode.x, (moveBridgeTarget?.y ?? 0) - movingBNode.y) <= 0.001);
  const distanceFromAToB = Math.hypot(movingBNode.x - currentA.x, movingBNode.y - currentA.y);
  assert.ok(distanceFromAToB >= currentA.r - movingBNode.r * 0.35);
  assert.ok(distanceFromAToB <= currentA.r + movingBNode.r * 1.1);
  assert.ok(movingBNode.x > currentA.x, 'B starts splitting from the side where it will finally settle');
  assert.ok(visibleStoryNodesAt(data, 1.5).some((node) => node.name === 'C 团队' && node.r > 1));
  assert.ok(visibleStoryNodesAt(data, 1.5).some((node) => node.name === 'D 团队' && node.r > 1));
  assert.equal(bNearDetach.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/b-company')
    && bridge.surfaceShape?.bridgeOnly === true
  )), true);
  assert.equal(bRightBeforeDetach.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/b-company')
    && bridge.surfaceShape?.bridgeOnly === true
  )), true);
  const visibleBNodes = visibleStoryNodesAt(data, 1.5).filter((node) => /B (团队|公司)/.test(node.name));
  const movingBRaw = visibleBNodes[0]?.raw as { id?: unknown } | undefined;
  assert.equal(visibleBNodes.length, 1);
  assert.equal(visibleBNodes[0]?.name, 'B 团队');
  assert.equal(movingBRaw?.id, 'b-team-a');
  const settlingB = visibleStoryNodesAt(data, 1.76).find((node) => node.name === 'B 公司');
  const settlingA = visibleStoryNodesAt(data, 1.76).find((node) => node.name === 'A 大公司');
  const settledB = visibleStoryNodesAt(data, 1.86).find((node) => node.name === 'B 公司');
  const bBeforeDetachNode = visibleStoryNodesAt(data, 1.69).find((node) => rawId(node) === 'b-company');
  const bExitStart = visibleStoryNodesAt(data, 1.7).find((node) => rawId(node) === 'b-company');
  assert.equal(hasMoveBridge(bDetachStart, '/company-a', '/b-company'), true);
  assert.equal(hasMoveBridge(bSettling, '/company-a', '/b-company'), true);
  assert.ok(settlingB);
  assert.ok(settlingA);
  assert.ok(settledB);
  assert.ok(bBeforeDetachNode);
  assert.ok(bExitStart);
  assert.ok(
    nodeDistance(bBeforeDetachNode, bExitStart) <= (bExitStart?.r ?? 0) * 0.9,
    'B keeps moving continuously when the spin-off enters settle'
  );
  assert.ok(Math.hypot((settlingB?.x ?? 0) - (settlingA?.x ?? 0), (settlingB?.y ?? 0) - (settlingA?.y ?? 0)) >= (settlingA?.r ?? 0));
  assert.ok(nodeDistance(bExitStart, settlingB) > 0.01);
  assert.ok(nodeDistance(settlingB, settledB) < nodeDistance(bExitStart, settledB));
  assert.ok(
    distanceFromLine(settlingB, bExitStart, settledB) <= (settledB?.r ?? 0) * 1.2,
    'B settles along a short path instead of orbiting around A'
  );
  assert.equal(bSettled.fluid?.bridges.some((bridge) => bridge.targetId.endsWith('/b-company')), false);
});

test('circle packing company story moves C and D with the same old-node bridge behavior as B', () => {
  const data = loadDemoData();
  const cMoving = storyLayoutAt(data, 2.25);
  const cNearDetach = storyLayoutAt(data, 2.35);
  const cRightBeforeDetach = storyLayoutAt(data, 2.39);
  const cDetachStart = storyLayoutAt(data, 2.4);
  const cSettling = storyLayoutAt(data, 2.48);
  const cIndependent = storyLayoutAt(data, 2.75);
  const cExitStart = visibleStoryNodesAt(data, 2.4).find((node) => rawId(node) === 'c-company');
  const cSettlingNode = visibleStoryNodesAt(data, 2.48).find((node) => rawId(node) === 'c-company');
  const cSettledNode = visibleStoryNodesAt(data, 2.6).find((node) => rawId(node) === 'c-company');
  const bBeforeCMoveStart = visibleStoryNodesAt(data, 1.84).find((node) => rawId(node) === 'b-company');
  const bAtCMoveStart = visibleStoryNodesAt(data, 1.85).find((node) => rawId(node) === 'b-company');
  const cBeforeCMoveStart = visibleStoryNodesAt(data, 1.84).find((node) => rawId(node) === 'c-team-a');
  const cAtCMoveStart = visibleStoryNodesAt(data, 1.85).find((node) => rawId(node) === 'c-team-a');
  const dMoving = storyLayoutAt(data, 3.65);
  const dContactingB = storyLayoutAt(data, 3.7);
  const dInsideB = storyLayoutAt(data, 3.85);
  const dSettling = storyLayoutAt(data, 4.08);
  const dSettled = storyLayoutAt(data, 4.16);

  const cBridge = findMoveBridge(cMoving, '/company-a', '/c-company');
  assertMoveBridgeMatchesNode(cMoving, cBridge);
  const movingCNode = cMoving.nodes.find((node) => node.id === cBridge?.targetId);
  const cMovingA = visibleStoryNodesAt(data, 2.25).find((node) => node.name === 'A 大公司');
  assert.ok(movingCNode);
  assert.ok(cMovingA);
  assert.ok(
    movingCNode.x > cMovingA.x && movingCNode.y < cMovingA.y,
    'C starts splitting from the side where it will finally settle'
  );
  assert.equal(cNearDetach.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/c-company')
    && bridge.surfaceShape?.bridgeOnly === true
  )), true);
  assert.equal(cRightBeforeDetach.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/c-company')
    && bridge.surfaceShape?.bridgeOnly === true
  )), true);
  const visibleCNodes = visibleStoryNodesAt(data, 2.25).filter((node) => /C (团队|公司)/.test(node.name));
  assert.equal(visibleCNodes.length, 1);
  assert.equal(visibleCNodes[0]?.name, 'C 团队');
  assert.equal(rawId(visibleCNodes[0]), 'c-team-a');
  assert.ok(visibleStoryNodesAt(data, 2.25).some((node) => node.name === 'D 团队' && node.r > 1));
  assert.equal(hasMoveBridge(cDetachStart, '/company-a', '/c-company'), true);
  assert.equal(hasMoveBridge(cSettling, '/company-a', '/c-company'), true);
  assert.ok(visibleStoryNodesAt(data, 2.48).some((node) => node.name === 'C 公司'));
  assert.ok(cExitStart);
  assert.ok(cSettlingNode);
  assert.ok(cSettledNode);
  const cBeforeDetachNode = visibleStoryNodesAt(data, 2.39).find((node) => rawId(node) === 'c-company');
  assert.ok(cBeforeDetachNode);
  assert.ok(
    nodeDistance(cBeforeDetachNode, cExitStart) <= (cExitStart?.r ?? 0) * 0.9,
    'C keeps moving continuously when the spin-off enters settle'
  );
  assert.ok(bBeforeCMoveStart);
  assert.ok(bAtCMoveStart);
  assert.ok(cBeforeCMoveStart);
  assert.ok(cAtCMoveStart);
  assert.ok(
    nodeDistance(bBeforeCMoveStart, bAtCMoveStart) <= (bBeforeCMoveStart?.r ?? 0) * 0.4,
    'B does not jump when C move starts after B settles'
  );
  assert.ok(
    nodeDistance(cBeforeCMoveStart, cAtCMoveStart) <= (cBeforeCMoveStart?.r ?? 0) * 0.4,
    'C does not jump when C move starts after B settles'
  );
  assert.ok(
    distanceFromLine(cSettlingNode, cExitStart, cSettledNode) <= (cSettledNode?.r ?? 0) * 1.2,
    'C settles along a short path instead of orbiting around A'
  );
  const independentC = cIndependent.nodes.find((node) => node.id.endsWith('/c-company'));
  const independentB = cIndependent.nodes.find((node) => node.id.endsWith('/b-company'));
  assert.ok(independentC);
  assert.ok(independentB);
  assert.equal(cIndependent.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/c-company') || bridge.targetId.endsWith('/c-company')
  )), false);
  assert.equal(circleContainsCircle(independentB, independentC), false);
  const cAcquireBridge = findAbsorbBridge(storyLayoutAt(data, 3.2), '/c-company', '/b-company');
  assert.ok(cAcquireBridge);
  assert.match(cAcquireBridge?.path ?? '', /^M /);
  assert.ok(((cAcquireBridge?.path ?? '').match(/\bM\b/g) || []).length >= 3);
  assert.equal(cAcquireBridge?.renderPath, false);
  assert.equal(cAcquireBridge?.surfaceShape?.bridgeOnly, undefined);
  assert.equal(cAcquireBridge?.color, independentB.color);
  assert.deepEqual(cAcquireBridge?.hiddenIds, []);
  assert.deepEqual(cAcquireBridge?.opaqueIds, [cAcquireBridge?.sourceId, cAcquireBridge?.targetId]);
  assert.deepEqual(cAcquireBridge?.elevatedIds, [cAcquireBridge?.sourceId]);
  const cAcquireBridgeShape = cAcquireBridge?.surfaceShape;
  const cAcquireMinRadius = Math.min(cAcquireBridgeShape?.leftRadius ?? 0, cAcquireBridgeShape?.rightRadius ?? 0);
  assert.ok((cAcquireBridgeShape?.neck ?? 0) >= cAcquireMinRadius * 0.9);

  const dBridge = findMoveBridge(dMoving, '/company-a', '/d-unit-b');
  assertMoveBridgeMatchesNode(dMoving, dBridge);
  assert.equal(findMoveBridge(dMoving, '/b-company', '/d-unit-b'), undefined);
  const dIncomingBridge = findMoveBridge(dContactingB, '/b-company', '/d-unit-b');
  assertMoveBridgeMatchesNode(dContactingB, dIncomingBridge);
  const receivingB = dContactingB.nodes.find((node) => node.id.endsWith('/b-company'));
  assert.ok(receivingB);
  assert.equal(dIncomingBridge?.color, receivingB.color);
  const dInsideTarget = dInsideB.nodes.find((node) => node.id.endsWith('/d-unit-b'));
  const dInsideParent = dInsideB.nodes.find((node) => node.id.endsWith('/b-company'));
  assert.ok(dInsideTarget);
  assert.ok(dInsideParent);
  assert.ok(circleContainsCircle(dInsideParent, dInsideTarget));
  assert.equal(dInsideB.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/company-a')
    && bridge.targetId.endsWith('/d-unit-b')
  )), false);
  assert.equal(dInsideB.fluid?.bridges.some((bridge) => (
    bridge.sourceId.endsWith('/b-company')
    && bridge.targetId.endsWith('/d-unit-b')
  )), true);
  const visibleDNodes = visibleStoryNodesAt(data, 3.65).filter((node) => /D (团队|独立团队)/.test(node.name));
  assert.equal(visibleDNodes.length, 1);
  assert.equal(visibleDNodes[0]?.name, 'D 团队');
  assert.equal(rawId(visibleDNodes[0]), 'd-team-a');
  assert.equal(dSettling.fluid?.bridges.some((bridge) => bridge.targetId.endsWith('/d-unit-b')), false);
  const settlingD = visibleStoryNodesAt(data, 4.08).find((node) => node.name === 'D 独立团队');
  const settledD = visibleStoryNodesAt(data, 4.16).find((node) => node.name === 'D 独立团队');
  assert.ok(settlingD);
  assert.ok(settledD);
  assert.ok(Math.hypot((settlingD?.x ?? 0) - (settledD?.x ?? 0), (settlingD?.y ?? 0) - (settledD?.y ?? 0)) < 1);
});

test('circle packing company story keeps B internal structure visible while A reacquires B', () => {
  const data = loadDemoData();
  const beforeReacquire = storyLayoutAt(data, 5.11);
  const reacquiringB = storyLayoutAt(data, 5.5);
  const beforeHandoff = storyLayoutAt(data, 6.19);
  const handoff = storyLayoutAt(data, 6.2);
  const afterInternalHandoff = storyLayoutAt(data, 6.45);
  const enteringB = beforeReacquire.nodes.find((node) => node.id.endsWith('/b-company'));
  const bCompany = reacquiringB.nodes.find((node) => node.id.endsWith('/b-company'));
  const dInsideB = reacquiringB.nodes.find((node) => node.id.endsWith('/d-unit-b'));
  const eInsideB = reacquiringB.nodes.find((node) => node.id.endsWith('/e-project-b'));
  const bridge = findAbsorbBridge(reacquiringB, '/b-company', '/company-a');
  const outgoingB = beforeHandoff.nodes.find((node) => node.id.endsWith('/b-company'));
  const internalB = handoff.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const finalInternalB = afterInternalHandoff.nodes.find((node) => node.id.endsWith('/b-unit-a'));

  assert.ok(bridge);
  assert.ok(enteringB);
  assert.ok(bCompany);
  assert.ok(dInsideB);
  assert.ok(eInsideB);
  assert.ok(outgoingB);
  assert.ok(internalB);
  assert.ok(finalInternalB);
  assert.ok(circleContainsCircle(bCompany, dInsideB));
  assert.ok(circleContainsCircle(bCompany, eInsideB));
  assert.ok((outgoingB?.r ?? 0) >= (enteringB?.r ?? 0) * 0.9, 'B does not collapse while A reacquires it');
  assert.ok((internalB?.r ?? 0) >= (enteringB?.r ?? 0) * 0.9, 'internal B handoff keeps B near its prior size');
  assert.ok(Math.abs((internalB?.r ?? 0) - (finalInternalB?.r ?? 0)) <= (finalInternalB?.r ?? 0) * 0.05, 'B does not regrow after the handoff');
});

test('circle packing company story keeps absorb source colors stable with solid bridge colors', () => {
  const data = loadDemoData();
  const independentC = storyLayoutAt(data, 2.75).nodes.find((node) => node.id.endsWith('/c-company'));
  const cAbsorbing = storyLayoutAt(data, 3.2);
  const absorbingC = cAbsorbing.nodes.find((node) => node.id.endsWith('/c-company'));
  const acquiringB = cAbsorbing.nodes.find((node) => node.id.endsWith('/b-company'));
  const cBridge = findAbsorbBridge(cAbsorbing, '/c-company', '/b-company');
  const independentB = storyLayoutAt(data, 5.1).nodes.find((node) => node.id.endsWith('/b-company'));
  const bAbsorbing = storyLayoutAt(data, 5.47);
  const absorbingB = bAbsorbing.nodes.find((node) => node.id.endsWith('/b-company'));
  const acquiringA = bAbsorbing.nodes.find((node) => node.id.endsWith('/company-a'));
  const bBridge = findAbsorbBridge(bAbsorbing, '/b-company', '/company-a');

  assert.ok(independentC);
  assert.ok(absorbingC);
  assert.ok(acquiringB);
  assert.ok(cBridge);
  assert.equal(absorbingC?.color, independentC?.color, 'C keeps its own color while being absorbed by B');
  assertAbsorbBridgeSolidColor(cBridge, acquiringB?.color);

  assert.ok(independentB);
  assert.ok(absorbingB);
  assert.ok(acquiringA);
  assert.ok(bBridge);
  assert.equal(absorbingB?.color, independentB?.color, 'B keeps its own color while A reacquires it');
  assertAbsorbBridgeSolidColor(bBridge, acquiringA?.color);
});

test('circle packing company story keeps B color continuous across spin-off and buyback handoffs', () => {
  const data = loadDemoData();
  const beforeSpinOffColor = storyLayoutAt(data, 1.19).nodes.find((node) => node.id.endsWith('/b-company'))?.color;
  const duringSpinOffColor = storyLayoutAt(data, 1.2).nodes.find((node) => node.id.endsWith('/b-company'))?.color;
  const beforeBuybackColor = storyLayoutAt(data, 6.19).nodes.find((node) => node.id.endsWith('/b-company'))?.color;
  const afterBuybackColor = storyLayoutAt(data, 6.2).nodes.find((node) => node.id.endsWith('/b-unit-a'))?.color;

  assert.equal(beforeSpinOffColor, duringSpinOffColor);
  assert.equal(beforeBuybackColor, afterBuybackColor);
  assert.equal(duringSpinOffColor, afterBuybackColor);
});

test('circle packing company story grows newly incubated teams from small buds', () => {
  const data = loadDemoData();

  assertTeamGrowsFromSmallBud(data, 'b-team-a', 0, 0.35);
  assertTeamGrowsFromSmallBud(data, 'c-team-a', 0.35, 0.7);
  assertTeamGrowsFromSmallBud(data, 'd-team-a', 0.7, 1);
});

test('circle packing company story keeps E bud outside existing B children', () => {
  const data = loadDemoData();
  const earlyEIncubation = storyLayoutAt(data, 4.291);
  const dInsideB = earlyEIncubation.nodes.find((node) => rawId(node) === 'd-unit-b');
  const eBud = earlyEIncubation.nodes.find((node) => rawId(node) === 'e-project-b');

  assert.ok(dInsideB, 'D is already operating inside B');
  assert.ok(eBud, 'E bud is visible while B incubates E');
  assert.equal(circleContainsCircle(dInsideB, eBud), false);
});

test('circle packing company story keeps D color continuous when D moves into B', () => {
  const data = loadDemoData();
  const beforeMoveCompleteColor = storyLayoutAt(data, 3.96).nodes.find((node) => node.id.endsWith('/d-unit-b'))?.color;
  const afterMoveCompleteColor = storyLayoutAt(data, 4.0).nodes.find((node) => node.id.endsWith('/d-unit-b'))?.color;

  assert.equal(beforeMoveCompleteColor, afterMoveCompleteColor);
});

test('circle packing company story keeps D inside B until D moves out as a peer', () => {
  const data = loadDemoData();
  const reacquired = storyLayoutAt(data, 6.2);
  const operating = storyLayoutAt(data, 6.35);
  const dStillInsideB = storyLayoutAt(data, 6.55);
  const dStartsLeavingB = storyLayoutAt(data, 6.61);
  const dOverstretchedStart = storyLayoutAt(data, 6.62);
  const dMovingWithBridge = storyLayoutAt(data, 6.65);
  const dStillLeavingB = storyLayoutAt(data, 6.67);
  const dLateLeavingB = storyLayoutAt(data, 6.68);
  const dAlmostOut = storyLayoutAt(data, 6.69);
  const dMoveComplete = storyLayoutAt(data, 6.7);
  const dMoveAfterGrowthStarts = storyLayoutAt(data, 6.8);
  const beforeFinalIncubation = storyLayoutAt(data, 7.09);
  const finalIncubationStart = storyLayoutAt(data, 7.1);

  const dInsideAfterBuyback = visibleStoryNodesAt(data, 6.2).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const dInsideWhileBForms = visibleStoryNodesAt(data, 6.35).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const dPeerBeforeMove = visibleStoryNodesAt(data, 6.44).find((node) => rawId(node) === 'd-unit-a');
  const aWhenDStartsLeaving = dStartsLeavingB.nodes.find((node) => node.id.endsWith('/company-a'));
  const aWhenDOverstretchedStarts = dOverstretchedStart.nodes.find((node) => node.id.endsWith('/company-a'));
  const aWhileDMoving = dMovingWithBridge.nodes.find((node) => node.id.endsWith('/company-a'));
  const aWhileDStillLeaving = dStillLeavingB.nodes.find((node) => node.id.endsWith('/company-a'));
  const bWhileDStillInside = dStillInsideB.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const dBeforeLeaving = visibleStoryNodesAt(data, 6.55).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const bWhileDMoving = dMovingWithBridge.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const dMovingOut = visibleStoryNodesAt(data, 6.65).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const dOverstretchedStartNode = visibleStoryNodesAt(data, 6.62).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const dStillLeavingNode = visibleStoryNodesAt(data, 6.67).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const bWhileDAlmostMoved = dAlmostOut.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const dAlmostMoved = visibleStoryNodesAt(data, 6.69).find((node) => rawId(node) === 'd-unit-b-inside-a');
  const dMoved = visibleStoryNodesAt(data, 6.7).find((node) => rawId(node) === 'd-unit-a');
  const aAlmostMoved = dAlmostOut.nodes.find((node) => node.id.endsWith('/company-a'));
  const aMoveComplete = dMoveComplete.nodes.find((node) => node.id.endsWith('/company-a'));
  const bAlmostMoved = dAlmostOut.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const bMoveComplete = dMoveComplete.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const eAlmostMoved = dAlmostOut.nodes.find((node) => node.id.endsWith('/e-unit-a'));
  const eMoveComplete = dMoveComplete.nodes.find((node) => node.id.endsWith('/e-unit-a'));
  const eAfterGrowthStarts = dMoveAfterGrowthStarts.nodes.find((node) => node.id.endsWith('/e-unit-a'));
  const aBeforeFinalIncubation = beforeFinalIncubation.nodes.find((node) => node.id.endsWith('/company-a'));
  const aFinalIncubationStart = finalIncubationStart.nodes.find((node) => node.id.endsWith('/company-a'));
  const bBeforeFinalIncubation = beforeFinalIncubation.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const bFinalIncubationStart = finalIncubationStart.nodes.find((node) => node.id.endsWith('/b-unit-a'));
  const dBeforeFinalIncubation = beforeFinalIncubation.nodes.find((node) => node.id.endsWith('/d-unit-a'));
  const dFinalIncubationStart = finalIncubationStart.nodes.find((node) => node.id.endsWith('/d-unit-a'));
  const dEarlyMoveBridge = findMoveBridge(dStartsLeavingB, '/b-unit-a', '/d-unit-a');
  const prematureDMoveBridge = findMoveBridge(dStillInsideB, '/b-unit-a', '/d-unit-a');
  const dOverstretchedStartBridge = findMoveBridge(dOverstretchedStart, '/b-unit-a', '/d-unit-a');
  const dMoveBridge = findMoveBridge(dMovingWithBridge, '/b-unit-a', '/d-unit-a');
  const dLateMoveBridge = findMoveBridge(dStillLeavingB, '/b-unit-a', '/d-unit-a');
  const dReconnectedMoveBridge = findMoveBridge(dLateLeavingB, '/b-unit-a', '/d-unit-a');
  const dAlmostMoveBridge = findMoveBridge(dAlmostOut, '/b-unit-a', '/d-unit-a');

  assert.ok(dInsideAfterBuyback, 'D remains visible inside B when A finishes reacquiring B');
  assert.ok(dInsideWhileBForms, 'D remains visible while B becomes an internal A unit');
  assert.equal(dPeerBeforeMove, undefined, 'peer D does not appear before the move-out phase starts');
  assert.ok(dBeforeLeaving);
  assert.ok(dMovingOut);
  assert.ok(dAlmostMoved);
  assert.ok(dMoved);
  assert.ok(dEarlyMoveBridge, 'D has a B-to-D bridge as soon as it starts leaving B');
  assert.equal(dOverstretchedStartBridge, undefined, 'D disconnects from B once the bridge-only shape would become overstretched');
  assert.equal(dMoveBridge, undefined, 'D does not keep an overstretched B-to-D bridge while moving out from B');
  assert.equal(dLateMoveBridge, undefined, 'D keeps the overstretched B-to-D bridge disconnected until it becomes visually bridgeable again');
  assert.equal(dReconnectedMoveBridge, undefined, 'D does not reconnect the B-to-D bridge later in the same move-out stage');
  assert.equal(dAlmostMoveBridge, undefined, 'D does not reconnect the B-to-D bridge right before the move completes');
  assert.ok(circleContainsCircle(reacquired.nodes.find((node) => node.id.endsWith('/b-unit-a')), dInsideAfterBuyback));
  assert.ok(circleContainsCircle(operating.nodes.find((node) => node.id.endsWith('/b-unit-a')), dInsideWhileBForms));
  assert.ok(circleContainsCircle(bWhileDStillInside, dBeforeLeaving), 'D is still fully inside B before the bridge should appear');
  assert.ok(circleContainsCircle(aWhenDStartsLeaving, dOverstretchedStartNode), 'D stays inside A when leaving B');
  assert.ok(circleContainsCircle(aWhenDOverstretchedStarts, dOverstretchedStartNode), 'D stays inside A when the B-to-D bridge disconnects');
  assert.ok(circleContainsCircle(aWhileDMoving, dMovingOut), 'D stays inside A at step 6.65');
  assert.ok(circleContainsCircle(aWhileDStillLeaving, dStillLeavingNode), 'D stays inside A before the move completes');
  assert.equal(prematureDMoveBridge, undefined, 'D does not show a B-to-D bridge before it crosses B boundary');
  assert.ok((dMovingOut?.x ?? 0) > (bWhileDMoving?.x ?? 0), 'D exits B from the right side during the move');
  assert.ok((dAlmostMoved?.x ?? 0) > (bWhileDAlmostMoved?.x ?? 0), 'D is already on the final side of B near the end of the move');
  assert.ok(
    Math.hypot((dAlmostMoved?.x ?? 0) - (dMoved?.x ?? 0), (dAlmostMoved?.y ?? 0) - (dMoved?.y ?? 0)) < 80,
    'D move-out frame stays close to the completed position'
  );
  assertRadiusContinuous(aAlmostMoved, aMoveComplete, 'A stays continuous when D move-out completes');
  assertRadiusContinuous(bAlmostMoved, bMoveComplete, 'B stays continuous when D move-out completes');
  assertRadiusContinuous(eAlmostMoved, eMoveComplete, 'E stays continuous when D move-out completes');
  assert.ok((eAfterGrowthStarts?.r ?? 0) > (eMoveComplete?.r ?? 0), 'E/F/G split grows after D move-out completes');
  assertRadiusContinuous(aBeforeFinalIncubation, aFinalIncubationStart, 'A stays continuous when final incubation starts');
  assertRadiusContinuous(bBeforeFinalIncubation, bFinalIncubationStart, 'B stays continuous when final incubation starts');
  assertRadiusContinuous(dBeforeFinalIncubation, dFinalIncubationStart, 'D stays continuous when final incubation starts');
});

test('circle packing company story disconnects overstretched bridge-only liquid shapes', () => {
  const data = loadDemoData();
  const layouts = [1.5, 1.76, 2.48, 3.7, 6.61, 6.62, 6.65, 6.67, 6.68, 6.69]
    .map((currentTime) => ({ currentTime, layout: storyLayoutAt(data, currentTime) }));

  layouts.forEach(({ currentTime, layout }) => {
    const overstretched = layout.fluid?.bridges
      .filter((bridge) => bridge.surfaceShape?.bridgeOnly)
      .filter((bridge) => bridgeOnlyGapRatio(bridge.surfaceShape) > 1.2)
      .map((bridge) => ({
        currentTime,
        pair: `${bridge.sourceId}->${bridge.targetId}`,
        gapRatio: bridgeOnlyGapRatio(bridge.surfaceShape)
      })) ?? [];

    assert.deepEqual(overstretched, []);
  });
});

test('circle packing company story demo gives every branch an explicit color', () => {
  const data = loadDemoData();
  const uncoloredBranches = collectUncoloredBranchNames(data.circlePackingCompanyStory);

  assert.deepEqual(uncoloredBranches, []);
});

function measureDepth(node: unknown): number {
  if (!node || typeof node !== 'object') return 0;
  const children = Array.isArray((node as { children?: unknown[] }).children)
    ? (node as { children: unknown[] }).children
    : [];
  if (!children.length) return 1;
  return 1 + Math.max(...children.map(measureDepth));
}

function collectUncoloredBranchNames(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  const record = node as {
    name?: unknown;
    children?: unknown[];
    itemStyle?: { color?: unknown };
  };
  const children = Array.isArray(record.children) ? record.children : [];
  const missing = children.length && typeof record.itemStyle?.color !== 'string'
    ? [String(record.name ?? 'unnamed')]
    : [];
  return missing.concat(children.flatMap(collectUncoloredBranchNames));
}

function collectNodeIds(node: unknown): Set<string> {
  const ids = new Set<string>();
  visit(node);
  return ids;

  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    const record = value as { id?: unknown; name?: unknown; children?: unknown[] };
    if (record.id != null) ids.add(String(record.id));
    if (record.name != null) ids.add(String(record.name));
    if (Array.isArray(record.children)) record.children.forEach(visit);
  }
}

function findEvent(events: unknown[], id: string): { type?: unknown; sources?: string[]; targets?: string[]; bridge?: unknown; duration?: unknown } | undefined {
  return events.find((event) => (
    !!event && typeof event === 'object' && (event as { id?: unknown }).id === id
  )) as { type?: unknown; sources?: string[]; targets?: string[]; bridge?: unknown; duration?: unknown } | undefined;
}

function eventRefs(refs: unknown): string[] {
  return Array.isArray(refs) ? Array.from(refs, String) : [];
}

function storyNodeNamesAt(data: ReturnType<typeof loadDemoData>, currentTime: number): string[] {
  return storyLayoutAt(data, currentTime).nodes.map((node) => node.name);
}

function visibleStoryNodesAt(data: ReturnType<typeof loadDemoData>, currentTime: number) {
  return storyLayoutAt(data, currentTime).nodes.filter((node) => node.r > 0.5);
}

function storyLayoutAt(data: ReturnType<typeof loadDemoData>, currentTime: number) {
  return resolveCirclePackingLayout({
    data: data.circlePackingCompanyStory,
    width: 900,
    height: 600,
    padding: 14,
    nodePadding: 3.6,
    siblingGap: 2.2,
    rootVisible: false,
    sort: 'none',
    fluid: {
      enabled: true,
      currentTime,
      events: data.circlePackingCompanyStoryEvents,
      bridgeOpacity: 0.9,
      bridgeThreshold: 320
    }
  });
}

function findBridgeCircleNearNode(
  shape: { x0?: number; y0?: number; r0?: number; x1?: number; y1?: number; r1?: number } | undefined,
  node: { x: number; y: number; r: number } | undefined
) {
  if (!shape || !node) return null;
  const candidates = [
    { x: shape.x0 ?? 0, y: shape.y0 ?? 0, r: shape.r0 ?? 0 },
    { x: shape.x1 ?? 0, y: shape.y1 ?? 0, r: shape.r1 ?? 0 }
  ];
  return candidates.find((candidate) => (
    Math.abs(candidate.r - node.r) <= 0.001
    && Math.hypot(candidate.x - node.x, candidate.y - node.y) <= 0.001
  )) || null;
}

function findMoveBridge(
  layout: ReturnType<typeof storyLayoutAt>,
  sourceSuffix: string,
  targetSuffix: string
) {
  return layout.fluid?.bridges.find((bridge) => (
    bridge.sourceId.endsWith(sourceSuffix)
    && bridge.targetId.endsWith(targetSuffix)
    && bridge.surfaceShape
  ));
}

function hasMoveBridge(
  layout: ReturnType<typeof storyLayoutAt>,
  sourceSuffix: string,
  targetSuffix: string
): boolean {
  return !!findMoveBridge(layout, sourceSuffix, targetSuffix);
}

function findAbsorbBridge(
  layout: ReturnType<typeof storyLayoutAt>,
  sourceSuffix: string,
  targetSuffix: string
) {
  return layout.fluid?.bridges.find((bridge) => (
    bridge.kind === 'absorb'
    && bridge.sourceId.endsWith(sourceSuffix)
    && bridge.targetId.endsWith(targetSuffix)
    && !!bridge.surfaceShape
  ));
}

function assertAbsorbBridgeSolidColor(
  bridge: ReturnType<typeof findAbsorbBridge>,
  targetColor: string | undefined
) {
  assert.equal((bridge as { gradient?: unknown } | undefined)?.gradient, undefined);
  assert.equal(bridge?.color, targetColor);
}

function assertMoveBridgeMatchesNode(
  layout: ReturnType<typeof storyLayoutAt>,
  bridge: ReturnType<typeof findMoveBridge>
) {
  assert.ok(bridge);
  assert.equal(bridge?.path, '');
  assert.equal(bridge?.surfaceShape?.bridgeOnly, true);
  assert.deepEqual(bridge?.hiddenIds, []);
  assert.deepEqual(bridge?.opaqueIds, [bridge?.targetId]);
  assert.deepEqual(bridge?.elevatedIds, [bridge?.targetId]);
  const movingNode = layout.nodes.find((node) => node.id === bridge?.targetId);
  assert.ok(movingNode);
  const bridgeTarget = findBridgeCircleNearNode(bridge?.surfaceShape, movingNode);
  assert.ok(bridgeTarget);
}

function bridgeOnlyGapRatio(
  shape: { x0?: number; y0?: number; r0?: number; x1?: number; y1?: number; r1?: number } | undefined
): number {
  if (!shape) return 0;
  const r0 = shape.r0 ?? 0;
  const r1 = shape.r1 ?? 0;
  const minRadius = Math.min(r0, r1);
  if (minRadius <= 0) return 0;
  const distance = Math.hypot((shape.x1 ?? 0) - (shape.x0 ?? 0), (shape.y1 ?? 0) - (shape.y0 ?? 0));
  return Math.max(0, distance - r0 - r1) / minRadius;
}

function rawId(node: { raw: unknown } | undefined): string {
  if (!node || !node.raw || typeof node.raw !== 'object') return '';
  return String((node.raw as { id?: unknown }).id ?? '');
}

function assertTeamGrowsFromSmallBud(
  data: ReturnType<typeof loadDemoData>,
  rawNodeId: string,
  startTime: number,
  completedTime: number
) {
  const startNode = visibleStoryNodesAt(data, startTime).find((node) => rawId(node) === rawNodeId);
  const completedNode = visibleStoryNodesAt(data, completedTime).find((node) => rawId(node) === rawNodeId);

  assert.ok(startNode, `${rawNodeId} is visible when incubation begins`);
  assert.ok(completedNode, `${rawNodeId} is visible when incubation completes`);
  assert.ok(
    (startNode?.r ?? 0) < (completedNode?.r ?? 0) * 0.25,
    `${rawNodeId} starts too close to its completed size`
  );
}

function assertRadiusContinuous(
  before: { r: number } | undefined,
  after: { r: number } | undefined,
  message: string
) {
  assert.ok(before, `${message}: missing before node`);
  assert.ok(after, `${message}: missing after node`);
  const tolerance = Math.max(1, (before?.r ?? 0) * 0.08);
  assert.ok(
    Math.abs((before?.r ?? 0) - (after?.r ?? 0)) <= tolerance,
    message
  );
}

function circleContainsCircle(
  container: { x: number; y: number; r: number } | undefined,
  child: { x: number; y: number; r: number } | undefined
): boolean {
  if (!container || !child) return false;
  return Math.hypot(child.x - container.x, child.y - container.y) + child.r <= container.r + 0.001;
}

function nodeDistance(
  left: { x: number; y: number } | undefined,
  right: { x: number; y: number } | undefined
): number {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function distanceFromLine(
  point: { x: number; y: number } | undefined,
  start: { x: number; y: number } | undefined,
  end: { x: number; y: number } | undefined
): number {
  if (!point || !start || !end) return Number.POSITIVE_INFINITY;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx) / distance;
}
