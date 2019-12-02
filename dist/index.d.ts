export declare type StyleParser = {
    id: string;
    isDefault?: boolean;
    style: string | string[];
    calculate: (value: CalculateValue, scale: number, options?: ResizedListenerOptions) => string;
    generate: (styleValue: string) => OriginalValue | false;
};
export interface ResizerParams {
    resizeMethod?: "transform" | "calculate" | "none";
    autoScaleBy?: "none" | "body" | "parent";
    autoScaleAxis?: "both" | "width" | "height";
    autogenerate?: boolean;
    width?: number;
    height?: number;
    container: HTMLElement;
    clearStalledTimeout?: number;
}
export declare type ResizedListenerOptions = {
    min?: number | number[];
    max?: number | number[];
};
export declare type OriginalValue = string | number | (string | number)[];
export declare type ResizeListener = {
    element: HTMLElement;
    styles: {
        [key: string]: {
            original: OriginalValue;
            options?: ResizedListenerOptions;
        };
    };
};
export declare type CalculateValue = number | string | (number | string)[];
export declare type CalculateParams = {
    value: CalculateValue | false;
    id: string;
    element: HTMLElement;
    options?: ResizedListenerOptions;
};
export default class ContentResizer {
    private static readonly DEFAULT_STALLED_TIMEOUT;
    private static ResizeObserver;
    private scale;
    private timeout;
    private params;
    private parsers;
    private watchedStyles;
    private lastWidth;
    private lastHeight;
    private cachedResizeTargets;
    constructor(params: ResizerParams);
    static setResizeObserverPolyfill(polyfill: any): void;
    private static clone;
    getParsers: (clone?: boolean | undefined) => StyleParser[];
    setParsers: (parsers: StyleParser[]) => void;
    getParserById(id: string, clone?: boolean): StyleParser | false;
    setParserById(parser: StyleParser, setId?: string): void;
    addParser: (parser: StyleParser) => void;
    setScale: (scale: number) => void;
    updateContainerScale: () => void;
    updateListenedElements: () => void;
    calc: (calcParams: CalculateParams) => string;
    removeStalledLinks: () => void;
    private resize;
    private formStyleValue;
    private autoGenerate;
    private setWatchedStyles;
}
