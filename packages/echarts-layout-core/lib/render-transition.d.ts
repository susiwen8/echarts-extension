import type { ElementHoverItem, HoverGraphicElement } from './element-hover.js';
export interface AliveRenderState {
    rendered: boolean;
}
export interface AliveRenderView {
    __aliveRenderState?: AliveRenderState;
}
export interface AliveRenderOptions {
    duration?: number;
    easing?: string;
}
export interface AliveGraphicElement extends HoverGraphicElement {
    type?: string;
    id?: string | number;
    name?: string;
    parent?: AliveGraphicGroup | null;
    isGroup?: boolean;
    shape?: Record<string, unknown>;
    style?: Record<string, unknown>;
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    originX?: number;
    originY?: number;
    skewX?: number;
    skewY?: number;
    z?: number;
    z2?: number;
    zlevel?: number;
    ignore?: boolean;
    silent?: boolean;
    invisible?: boolean;
    cursor?: unknown;
    anid?: string;
    children?: () => AliveGraphicElement[];
    childrenRef?: () => AliveGraphicElement[];
    attr?: (keyOrObj: unknown, value?: unknown) => void;
    animateTo?: (target: Record<string, unknown>, config?: Record<string, unknown>, animationProps?: Record<string, unknown>) => void;
    stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
    dirty?: () => void;
}
export interface AliveGraphicGroup extends AliveGraphicElement {
    add(element: AliveGraphicElement): void;
    remove?: (element: AliveGraphicElement) => void;
    removeAll(): void;
}
export interface AliveRenderHost {
    graphic: {
        Group: new () => AliveGraphicGroup;
    };
}
export interface AliveRenderFrame<TPayload> {
    hoverItems?: ElementHoverItem[];
    payload?: TPayload;
}
export interface AliveRenderResult<TPayload> {
    hoverItems: ElementHoverItem[];
    payload?: TPayload;
    mapElement<TElement extends AliveGraphicElement | null | undefined>(element: TElement): TElement;
}
export declare function setAliveRenderKey(element: AliveGraphicElement | null | undefined, key: string): void;
export declare function renderAlive<TSeriesModel, TPayload = undefined>(view: AliveRenderView, echartsHost: AliveRenderHost, group: AliveGraphicGroup, seriesModel: TSeriesModel, render: (targetGroup: AliveGraphicGroup, seriesModel: TSeriesModel, isUpdate: boolean) => ElementHoverItem[] | AliveRenderFrame<TPayload> | void, options?: AliveRenderOptions): AliveRenderResult<TPayload>;
export declare function clearAliveRender(view: AliveRenderView): void;
