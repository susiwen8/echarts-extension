export interface ElementHoverItem {
    elements: HoverGraphicElement[];
    triggerElements?: HoverGraphicElement[];
}
export interface ElementHoverOptions {
    dimOpacity?: number;
    transitionDuration?: number;
    transitionEasing?: string;
    zrender?: HoverZRender | null;
}
export interface ElementHoverController {
    dispose(): void;
}
export interface HoverGraphicElement {
    [key: string]: unknown;
}
interface HoverZRender {
    on(eventName: string, handler: (event: HoverZRenderEvent) => void): void;
    off(eventName: string, handler: (event: HoverZRenderEvent) => void): void;
}
interface HoverZRenderEvent {
    target?: unknown;
}
export declare function installElementHover(items: ElementHoverItem[], options?: ElementHoverOptions): ElementHoverController | undefined;
export {};
