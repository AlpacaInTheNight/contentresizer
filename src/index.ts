import parserGeneral from './formaters/general';
import parserTransform from './formaters/matrix';

export type StyleParser = {
	id: string;
	isDefault?: boolean;
	style: string | string[];
	calculate: (value: CalculateValue, scale: number, options?: ResizedListenerOptions) => string;
	generate: (styleValue: string) => OriginalValue | false;
};

export interface ResizerParams {

	/**
	 * A method that will be used to resize the target container. One of possible:
	 * "transform" - will set container scale via transform: scale CSS style.
	 * You probably don't need a library to do that, but it is still supported.
	 * "calculate" - default method. Will calculate supported style values. Intended to be used with the calc() method.
	 * "none" - will do nothing.
	 */
	resizeMethod?: "transform" | "calculate" | "none";

	/**
	 * Determine the wrapper by the size of which the target container will be scaled to fill it.
	 * "body" - default. Will track the size of the body tag.
	 * "parent" - will track the size of the parent node. This requires the support of the Resize Observer or a provided polyfill.
	 * "none" - will do nothing.
	 */
	autoScaleBy?: "none" | "body" | "parent";

	/**
	 * The axis on which scale will be calculated.
	 */
	autoScaleAxis?: "both" | "width" | "height";

	/**
	 * If set to true - will create style resizers for the "calculate" method automatically.
	 */
	autogenerate?: boolean;

	/**
	 * The initial width of the target container. If not set - offsetWidth will be assigned for it.
	 */
	width?: number;

	/**
	 * The initial height of the target container. If not set - offsetHeight will be assigned for it.
	 */
	height?: number;

	/**
	 * Target container to be scaled to its wrapper container bounds.
	 */
	container: HTMLElement;

	/**
	 * Since calculate method caches elements which styles it tracks
	 * they need to be freed from cache after they are being remove from the document.
	 * This param set timeout in ms beetween cache clearing from the removed dom element after the new style recalucalation request.
	 * Default is 1s.
	 */
	clearStalledTimeout?: number;
}

export type ResizedListenerOptions = {
	min?: number | number[];
	max?: number | number[];
};

export type OriginalValue = string | number | (string | number)[];

export type ResizeListener = {
	element: HTMLElement;
	styles: {
		[key: string]: {
			original: OriginalValue;
			options?: ResizedListenerOptions;
		}
	};
};

export type CalculateValue = number | string | (number | string)[];

export type CalculateParams = {
	/**
	 * Style value: number | string | (number | string)[]
	 */
	value: CalculateValue | false;

	/**
	 * Javascript name of the style
	 */
	id: string;

	/**
	 * Link to dom element containing target style
	 */
	element: HTMLElement;

	/**
	 * Additional options
	 */
	options?: ResizedListenerOptions;
};

export default class ContentResizer {

	/**
	 * Default time before cached element will be filtered from deleted DOM elements
	 */
	private static readonly DEFAULT_STALLED_TIMEOUT = 1000;

	/**
	 * Link to the Window.ResizeObserver or a polyfill set via Resizer.setResizeObserverPolyfill method
	 */
	private static ResizeObserver: any = window["ResizeObserver"];

	/**
	 * The current scale of the target container (params.container)
	 */
	private scale: number = 1;

	private timeout: NodeJS.Timeout | false = false;

	/**
	 * Params provided to the constructor
	 */
	private params: ResizerParams;

	/**
	 * An array of Style Parser objects
	 */
	private parsers: StyleParser[] = [];

	/**
	 * List of styles to be tracked for auto-resize. Generated based on provided parsers
	 */
	private watchedStyles: string[] = [];

	private lastWidth: number = 1;
	private lastHeight: number = 1;

	/**
	 * An array of cached ResizeListener objects.
	 * It contains links to DOM elements that are cleared by removeStalledLinks method if they are deleted from the document.
	 */
	private cachedResizeTargets: ResizeListener[] = [];

	public constructor(params: ResizerParams) {
		if(!params.autoScaleAxis) params.autoScaleAxis = "both";
		if(!params.autoScaleBy) params.autoScaleBy = "body";
		if(!params.resizeMethod) params.resizeMethod = "calculate";
		if(!params.clearStalledTimeout) params.clearStalledTimeout = ContentResizer.DEFAULT_STALLED_TIMEOUT;
		this.params = params;

		this.addParser(parserGeneral);
		this.addParser(parserTransform);

		if(this.params.autogenerate) this.autoGenerate();

		if(!this.params.width) {
			this.params.width = this.params.container.offsetWidth;
		}

		if(!this.params.height) {
			this.params.height = this.params.container.offsetHeight;
		}

		if(this.params.autoScaleBy && this.params.autoScaleBy !== "none") {
			this.resize();
			
			switch(this.params.autoScaleBy) {
				case "body":
					window.addEventListener("resize", this.resize);
					break;

				case "parent":
					const parent = this.params.container.parentNode as HTMLElement | null;
					if(parent && ContentResizer.ResizeObserver) {
						const ro = new ContentResizer.ResizeObserver(() => this.resize());
						ro.observe(parent);
					}
			}
		}
	}

	/**
	 * Sets ResizeObserver polyfill
	 * For examle: https://github.com/que-etc/resize-observer-polyfill
	 * @param polyfill 
	 */
	public static setResizeObserverPolyfill(polyfill: any) {
		ContentResizer.ResizeObserver = polyfill;
	}

	/**
	 * Used to clone simple data inside the class
	 * @param data 
	 */
	private static clone<T>(data: T): T {
		return JSON.parse(JSON.stringify(data));
	}

	/**
	 * Returns style parsers array
	 * @param clone - if set to true will return clone instead of a link
	 */
	public getParsers = (clone?: boolean): StyleParser[] => {
		if(clone) return ContentResizer.clone(this.parsers);
		else return this.parsers;
	}

	/**
	 * Sets style parsers array
	 * @param parsers - new parsers object
	 */
	public setParsers = (parsers: StyleParser[]) => {
		this.parsers = parsers;
		this.setWatchedStyles();
	}

	/**
	 * Returns specific style parser by id
	 * @param id - target parser id
	 * @param clone - if set to true will return clone instead of a link
	 */
	public getParserById(id: string, clone?: boolean): StyleParser | false {
		const targetParser = this.parsers.find(parser => parser.id === id);
		if(!targetParser) return false;

		if(clone) return JSON.parse(JSON.stringify(targetParser));
		else return targetParser;
	}

	/**
	 * Replaces target style parser
	 * @param parser - style parser object
	 * @param id - if set will replace parser with this id instead of the one with id set in the parser object
	 */
	public setParserById(parser: StyleParser, setId?: string) {
		const id = setId || parser.id;

		for(const i in this.parsers) {
			if(this.parsers[i].id === id) this.parsers[i] = parser;
		}

		this.setWatchedStyles();
	}

	/**
	 * Registers new style parser
	 * @param parser - StyleParser object
	 */
	public addParser = (parser: StyleParser) => {
		this.parsers.unshift(parser);
		this.setWatchedStyles();
	}

	/**
	 * Returns current target container scale
	 */
	public setScale = (scale: number) => {
		if(!scale) return;
		if(typeof scale !== "number") return;
		if(scale <= 0 || scale > 10000) return;

		this.scale = scale;
		this.params.resizeMethod === "calculate" && this.updateListenedElements();
	}

	/**
	 * Updates target container scale based on autoScale params
	 */
	public updateContainerScale = () => {
		const {params} = this;
		const width = params.width as number;
		const height = params.height as number;

		const {resizeMethod, container, autoScaleBy, autoScaleAxis} = this.params;

		let containerWidth = this.lastWidth;
		let containerHeight = this.lastHeight;

		if(autoScaleBy === "body") {
			containerWidth = document.body.clientWidth;
			containerHeight = document.body.clientHeight;
		}

		if(autoScaleBy === "parent") {
			const parent = container.parentNode as HTMLElement;
			if(!parent) return;

			containerWidth = parent.clientWidth;
			containerHeight = parent.clientHeight;
		}

		let scale: number = 1;
		const ratioWidth = containerWidth / width;
		const ratioHeight = containerHeight / height;

		switch(autoScaleAxis) {
			case "both":
				if(ratioWidth < ratioHeight) {
					scale = containerWidth / width;
				} else {
					scale = containerHeight / height;
				}
				break;

			case "height":
				scale = containerHeight / height;
				break;

			case "width":
				scale = containerWidth / width;
				break;
		}

		scale = parseFloat( scale.toFixed(2) );
		if(resizeMethod === "transform") {
			container.style.transform = `scale(${scale})`;
		}

		this.setScale(scale);
	}

	/**
	 * Cycles through this.cachedResizeTargets and updates cached element's listened styles
	 */
	public updateListenedElements = () => {
		if(this.params.resizeMethod !== "calculate") return;

		this.cachedResizeTargets.forEach(item => {
			const {element, styles} = item;
			if(!element || !styles) return;

			const transition = element.style.transition;
			element.style.transition = "";

			for(const id in styles) {
				const originalValue = styles[id].original;

				const newValue = this.formStyleValue(originalValue, id, styles[id].options);
				element.style[id] = newValue;
			}

			element.style.transition = transition;
		});
	}

	/**
	 * Returns scaled style value based on provided params.
	 * If the resize method is set to "calculate" it will create a new ResizeListener entry in the cachedResizeTargets.
	 * If the DOM element is already present in the cache - it will update it instead of creating an extra copy.
	 * @param calcParams - CalculateParams object
	 */
	public calc = (calcParams: CalculateParams): string => {
		let {value} = calcParams;
		if(!value) return "";

		const {id, element, options} = calcParams;
		const {clearStalledTimeout = ContentResizer.DEFAULT_STALLED_TIMEOUT} = this.params;
		
		if(this.params.resizeMethod !== "calculate") {
			const unScaledValue = this.formStyleValue(value, id, options);
			element.style[id] = unScaledValue;
			return unScaledValue;
		}

		const self = this;

		if(this.timeout === false) {
			this.timeout = setTimeout(self.removeStalledLinks, clearStalledTimeout);
		}

		if(typeof value === "string") {
			value = parseFloat(value);
		}

		const targetCache = this.cachedResizeTargets.find((item: ResizeListener) => item.element === element);

		if(!targetCache) {
			this.cachedResizeTargets.push({
				element,
				styles: {
					[id]: {
						original: value,
						options,
					}
				}
			});
		} else {
			targetCache.styles[id] = {
				original: value,
				options
			};
		}

		const formedValue = this.formStyleValue(value, id, options);
		element.style[id] = formedValue;
		return formedValue;
	}

	/**
	 * Frees removed dom elements from memory
	 */
	public removeStalledLinks = () => {
		this.cachedResizeTargets = this.cachedResizeTargets.filter(item => document.contains(item.element));
		this.timeout = false;
	}

	/**
	 * Resizes target container based on the params settings
	 */
	private resize = () => {
		const {autoScaleBy, resizeMethod, container} = this.params;
		if(!autoScaleBy || autoScaleBy === "none") return;

		let newWidth = this.lastWidth;
		let newHeight = this.lastHeight;

		if(autoScaleBy === "body") {
			newWidth = document.body.clientWidth;
			newHeight = document.body.clientHeight;
		}
		
		if(autoScaleBy === "parent") {
			const parent = container.parentNode as HTMLElement;
			if(!parent) return;

			newWidth = parent.clientWidth;
			newHeight = parent.clientHeight;
		}

		if(this.lastWidth !== newWidth || this.lastHeight !== newHeight) {
			this.updateContainerScale();
			resizeMethod === "calculate" && this.updateListenedElements();
		}

		this.lastWidth = newWidth;
		this.lastHeight = newHeight;
	}

	/**
	 * Checks list of style parsers to see if any is listening to the target style
	 * and if so - calls calculate method of the target style parser.
	 * It is intended to be used with the calculate method.
	 * If resizeMethod is anything but "calculate" - scale will be considered to be 1 regardless of its actual value
	 * @param value - CalculateValue
	 * @param styleID - target style name in JS naming
	 * @param options - options for the style parser calculate method
	 */
	private formStyleValue = (value: CalculateValue, styleID: string, options?: ResizedListenerOptions): string => {
		let {scale} = this;
		const {resizeMethod} = this.params;
		if(resizeMethod !== "calculate") scale = 1;

		for(const parser of this.parsers) {
			if(
				(Array.isArray(parser.style) && parser.style.includes(styleID)) ||
				(typeof parser.style === "string" && parser.style === styleID)
			) {
				return parser.calculate(value, scale, options);
			}
		}

		return "";
	}

	/**
	 * Automatically generates style listeners for the target container (params.container)
	 */
	private autoGenerate = () => {
		const {container} = this.params;
		if(!container) return;
		const self = this;

		function walk(node: HTMLElement, process: (node: HTMLElement) => void) {
			if(node instanceof HTMLElement !== true) return;
			process(node);

			for(const child of node.children) {
				walk(child as HTMLElement, process);
			}
		}

		function generateListeners(node: HTMLElement) {

			//NOTE: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle#Notes
			const computed = getComputedStyle(node);

			for(const styleID of self.watchedStyles) {
				if(!computed[styleID]) continue;

				self.parsers.some(parser => {
					if(
						(Array.isArray(parser.style) && parser.style.includes(styleID)) ||
						(typeof parser.style === "string" && parser.style === styleID)
					) {
						self.calc({value: parser.generate(computed[styleID]), id: styleID, element: node});
						return true;
					}

					return false;
				});
			}
		}
		
		walk(container, generateListeners);
	}

	/**
	 * Updates watched styles based on "style" property of the style parser objects in the this.parsers array
	 */
	private setWatchedStyles = () => {
		const watchedStyles: string[] = [];
		
		for(const parser of this.parsers) {
			if(Array.isArray(parser.style)) {
				for(const style of parser.style) {
					if(!watchedStyles.includes(style)) watchedStyles.push(style);
				}
			} else {
				if(!watchedStyles.includes(parser.style)) watchedStyles.push(parser.style);
			}
		}

		this.watchedStyles = watchedStyles;
	}
}
