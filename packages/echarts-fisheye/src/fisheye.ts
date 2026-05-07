import * as echarts from 'echarts/lib/echarts';
import {
  installFisheyeController,
  resolveFisheyeOptions,
  setFisheyeGraphicIgnore
} from '@echarts-extension/layout-core';
import type {
  FisheyeController,
  FisheyeGraphicElement,
  FisheyeOptions,
  FisheyeZRenderLike
} from '@echarts-extension/layout-core';

interface FisheyeComponentModel {
  option?: unknown;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): FisheyeZRenderLike;
}

interface GraphicGroup extends FisheyeGraphicElement {
  add(element: FisheyeGraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  ignore?: boolean;
  silent?: boolean;
  z2?: number;
}

interface EChartsHost {
  extendComponentModel(option: Record<string, unknown>): void;
  extendComponentView(option: Record<string, unknown>): void;
  graphic: {
    Circle: new (options: GraphicElementOptions) => FisheyeGraphicElement;
  };
}

interface FisheyeComponentView {
  group: GraphicGroup;
  __fisheyeController?: FisheyeController;
  __fisheyeLens?: FisheyeGraphicElement;
}

const FISHEYE_ELEMENT_FLAG = '__echartsExtensionFisheyeElement';
const echartsHost = echarts as unknown as EChartsHost;

echartsHost.extendComponentModel({
  type: 'fisheye',

  defaultOption: {
    show: false,
    radius: null,
    scale: 2.2,
    stroke: 'rgba(17, 24, 39, 0.86)',
    strokeWidth: 3,
    opacity: 0.92,
    preview: false
  }
});

echartsHost.extendComponentView({
  type: 'fisheye',

  render(this: FisheyeComponentView, model: FisheyeComponentModel, ecModel: unknown, api: EChartsApi) {
    this.__fisheyeController?.dispose();
    this.__fisheyeController = undefined;
    this.group.removeAll();

    const viewport = {
      x: 0,
      y: 0,
      width: api.getWidth(),
      height: api.getHeight()
    };
    const fisheye = resolveFisheyeOptions(model.option, viewport);
    if (!fisheye) return;

    const lens = createLens(fisheye);
    this.__fisheyeLens = lens;
    this.group.add(lens);
    this.__fisheyeController = installFisheyeController({
      zrender: api.getZr?.(),
      viewport,
      fisheye,
      lens,
      excludeElement: isFisheyeElement
    });
  },

  remove(this: FisheyeComponentView) {
    this.__fisheyeController?.dispose();
    this.__fisheyeController = undefined;
    if (this.__fisheyeLens) setFisheyeGraphicIgnore(this.__fisheyeLens, true);
    this.__fisheyeLens = undefined;
    this.group.removeAll();
  },

  dispose(this: FisheyeComponentView) {
    this.__fisheyeController?.dispose();
    this.__fisheyeController = undefined;
    if (this.__fisheyeLens) setFisheyeGraphicIgnore(this.__fisheyeLens, true);
    this.__fisheyeLens = undefined;
    this.group.removeAll();
  }
});

function createLens(fisheye: FisheyeOptions): FisheyeGraphicElement {
  const lens = new echartsHost.graphic.Circle({
    shape: {
      cx: 0,
      cy: 0,
      r: fisheye.radius
    },
    style: {
      fill: null,
      stroke: fisheye.stroke,
      lineWidth: fisheye.strokeWidth,
      opacity: fisheye.opacity
    },
    ignore: true,
    silent: true,
    z2: 10000
  });
  markFisheyeElement(lens);
  return lens;
}

function markFisheyeElement(element: FisheyeGraphicElement): void {
  element[FISHEYE_ELEMENT_FLAG] = true;
}

function isFisheyeElement(element: FisheyeGraphicElement): boolean {
  return element[FISHEYE_ELEMENT_FLAG] === true;
}
