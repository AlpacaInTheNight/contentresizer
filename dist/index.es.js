const resizableStyles = [
    "width",
    "height",
    "fontSize",
    "padding",
    "margin",
    "border",
    "outline",
    "webkitTextStroke",
];
const PRECISION = 8;
function calculate(value, scale, options) {
    var _a, _b, _c, _d;
    if (Array.isArray(value)) {
        const max = ((_a = options) === null || _a === void 0 ? void 0 : _a.max) && Array.isArray(options.max) ? options.max : undefined;
        const min = ((_b = options) === null || _b === void 0 ? void 0 : _b.min) && Array.isArray(options.min) ? options.min : undefined;
        const cloneArr = value.slice();
        for (const i in cloneArr) {
            if (typeof cloneArr[i] === "number") {
                let scaled = cloneArr[i] * scale;
                if (max && max[i] && scaled > max[i])
                    scaled = max[i];
                if (min && min[i] && scaled < min[i])
                    scaled = min[i];
                cloneArr[i] = parseFloat(scaled.toFixed(PRECISION)) + "px";
            }
        }
        return cloneArr.join(" ");
    }
    if (typeof value === "number") {
        let scaled = value * scale;
        if ((_c = options) === null || _c === void 0 ? void 0 : _c.max) {
            if (typeof options.max === "number" && scaled > options.max)
                scaled = options.max;
            if (Array.isArray(options.max) && scaled > options.max[0])
                scaled = options.max[0];
        }
        if ((_d = options) === null || _d === void 0 ? void 0 : _d.min) {
            if (typeof options.min === "number" && scaled < options.min)
                scaled = options.min;
            if (Array.isArray(options.min) && scaled < options.min[0])
                scaled = options.min[0];
        }
        return parseFloat(scaled.toFixed(PRECISION)) + "px";
    }
    return value;
}
function generate(styleValue) {
    const valuesArr = styleValue.split(" ");
    for (const i in valuesArr) {
        const numericValue = parseFloat(valuesArr[i]);
        if (!isNaN(numericValue))
            valuesArr[i] = numericValue;
    }
    return valuesArr.length > 1 ? valuesArr : valuesArr[0];
}
const parser = {
    id: "general",
    isDefault: true,
    style: resizableStyles,
    calculate,
    generate
};

const PRECISION$1 = 8;
const DEFAULT_MATRIX = [1, 0, 0, 1, 0, 0];
const TRANSLATEX = 4;
const TRANSLATEY = 5;
const ERR_UNSUPPORTED_FORMAT = new Error('Usupported matrix format');
function setMatrix(value, scale, options) {
    var _a, _b;
    const matrixArr = value.slice();
    let scaledTrX = matrixArr[TRANSLATEX] * scale;
    let scaledTrY = matrixArr[TRANSLATEY] * scale;
    function setMinMax(arr, type = "max") {
        let boundX = arr[0];
        let boundY = arr[1];
        if (arr.length === 6) {
            boundX = arr[TRANSLATEX];
            boundY = arr[TRANSLATEY];
        }
        if (boundX && (type === "max" && scaledTrX > boundX) || (type === "min" && scaledTrX < boundX))
            scaledTrX = boundX;
        if (boundY && (type === "max" && scaledTrY > boundY) || (type === "min" && scaledTrY < boundY))
            scaledTrY = boundY;
    }
    if (((_a = options) === null || _a === void 0 ? void 0 : _a.max) && Array.isArray(options.max))
        setMinMax(options.max, "max");
    if (((_b = options) === null || _b === void 0 ? void 0 : _b.min) && Array.isArray(options.min))
        setMinMax(options.min, "min");
    matrixArr[TRANSLATEX] = parseFloat(scaledTrX.toFixed(PRECISION$1));
    matrixArr[TRANSLATEY] = parseFloat(scaledTrY.toFixed(PRECISION$1));
    return matrixArr;
}
function calculate$1(value, scale, options) {
    if (!Array.isArray(value))
        throw (ERR_UNSUPPORTED_FORMAT);
    for (const i in value) {
        if (typeof value[i] === "string")
            value[i] = parseFloat(value[i]);
    }
    let matrix = [];
    if (value.length === 2) {
        matrix = DEFAULT_MATRIX;
        matrix[TRANSLATEX] = value[0];
        matrix[TRANSLATEY] = value[1];
    }
    else if (value.length === 6) {
        matrix = value.slice();
    }
    else {
        throw (ERR_UNSUPPORTED_FORMAT);
    }
    matrix = setMatrix(matrix, scale, options);
    return `matrix(${matrix.join(", ")})`;
}
function generate$1(styleValue) {
    if (styleValue === "none")
        return false;
    const numberPattern = /-?\d+\.?\d*/g;
    const values = styleValue.match(numberPattern);
    if (!values)
        return false;
    for (const i in values) {
        const numericValue = parseFloat(values[i]);
        if (!isNaN(numericValue))
            values[i] = numericValue;
    }
    return values;
}
const parserMatrix = {
    id: "translate",
    style: "transform",
    calculate: calculate$1,
    generate: generate$1
};

class ContentResizer {
    constructor(params) {
        this.scale = 1;
        this.timeout = false;
        this.parsers = [];
        this.watchedStyles = [];
        this.lastWidth = 1;
        this.lastHeight = 1;
        this.cachedResizeTargets = [];
        this.getParsers = (clone) => {
            if (clone)
                return ContentResizer.clone(this.parsers);
            else
                return this.parsers;
        };
        this.setParsers = (parsers) => {
            this.parsers = parsers;
            this.setWatchedStyles();
        };
        this.addParser = (parser) => {
            this.parsers.unshift(parser);
            this.setWatchedStyles();
        };
        this.setScale = (scale) => {
            if (!scale)
                return;
            if (typeof scale !== "number")
                return;
            if (scale <= 0 || scale > 10000)
                return;
            this.scale = scale;
            this.params.resizeMethod === "calculate" && this.updateListenedElements();
        };
        this.updateContainerScale = () => {
            const { params } = this;
            const width = params.width;
            const height = params.height;
            const { resizeMethod, container, autoScaleBy, autoScaleAxis } = this.params;
            let containerWidth = this.lastWidth;
            let containerHeight = this.lastHeight;
            if (autoScaleBy === "body") {
                containerWidth = document.body.clientWidth;
                containerHeight = document.body.clientHeight;
            }
            if (autoScaleBy === "parent") {
                const parent = container.parentNode;
                if (!parent)
                    return;
                containerWidth = parent.clientWidth;
                containerHeight = parent.clientHeight;
            }
            let scale = 1;
            const ratioWidth = containerWidth / width;
            const ratioHeight = containerHeight / height;
            switch (autoScaleAxis) {
                case "both":
                    if (ratioWidth < ratioHeight) {
                        scale = containerWidth / width;
                    }
                    else {
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
            scale = parseFloat(scale.toFixed(2));
            if (resizeMethod === "transform") {
                container.style.transform = `scale(${scale})`;
            }
            this.setScale(scale);
        };
        this.updateListenedElements = () => {
            if (this.params.resizeMethod !== "calculate")
                return;
            this.cachedResizeTargets.forEach(item => {
                const { element, styles } = item;
                if (!element || !styles)
                    return;
                const transition = element.style.transition;
                element.style.transition = "";
                for (const id in styles) {
                    const originalValue = styles[id].original;
                    const newValue = this.formStyleValue(originalValue, id, styles[id].options);
                    element.style[id] = newValue;
                }
                element.style.transition = transition;
            });
        };
        this.calc = (calcParams) => {
            let { value } = calcParams;
            if (!value)
                return "";
            const { id, element, options } = calcParams;
            const { clearStalledTimeout = ContentResizer.DEFAULT_STALLED_TIMEOUT } = this.params;
            if (this.params.resizeMethod !== "calculate")
                return this.formStyleValue(value, id, options);
            const self = this;
            if (this.timeout === false) {
                this.timeout = setTimeout(self.removeStalledLinks, clearStalledTimeout);
            }
            if (typeof value === "string") {
                value = parseFloat(value);
            }
            const targetCache = this.cachedResizeTargets.find((item) => item.element === element);
            if (!targetCache) {
                this.cachedResizeTargets.push({
                    element,
                    styles: {
                        [id]: {
                            original: value,
                            options,
                        }
                    }
                });
            }
            else {
                targetCache.styles[id] = {
                    original: value,
                    options
                };
            }
            return this.formStyleValue(value, id, options);
        };
        this.removeStalledLinks = () => {
            this.cachedResizeTargets = this.cachedResizeTargets.filter(item => document.contains(item.element));
            this.timeout = false;
        };
        this.resize = () => {
            const { autoScaleBy, resizeMethod, container } = this.params;
            if (!autoScaleBy || autoScaleBy === "none")
                return;
            let newWidth = this.lastWidth;
            let newHeight = this.lastHeight;
            if (autoScaleBy === "body") {
                newWidth = document.body.clientWidth;
                newHeight = document.body.clientHeight;
            }
            if (autoScaleBy === "parent") {
                const parent = container.parentNode;
                if (!parent)
                    return;
                newWidth = parent.clientWidth;
                newHeight = parent.clientHeight;
            }
            if (this.lastWidth !== newWidth || this.lastHeight !== newHeight) {
                this.updateContainerScale();
                resizeMethod === "calculate" && this.updateListenedElements();
            }
            this.lastWidth = newWidth;
            this.lastHeight = newHeight;
        };
        this.formStyleValue = (value, styleID, options) => {
            let { scale } = this;
            const { resizeMethod } = this.params;
            if (resizeMethod !== "calculate")
                scale = 1;
            for (const parser of this.parsers) {
                if ((Array.isArray(parser.style) && parser.style.includes(styleID)) ||
                    (typeof parser.style === "string" && parser.style === styleID)) {
                    return parser.calculate(value, scale, options);
                }
            }
            return "";
        };
        this.autoGenerate = () => {
            const { container } = this.params;
            if (!container)
                return;
            const self = this;
            function walk(node, process) {
                if (node instanceof HTMLElement !== true)
                    return;
                process(node);
                for (const child of node.children) {
                    walk(child, process);
                }
            }
            function generateListeners(node) {
                const computed = getComputedStyle(node);
                for (const styleID of self.watchedStyles) {
                    if (!computed[styleID])
                        continue;
                    self.parsers.some(parser => {
                        if ((Array.isArray(parser.style) && parser.style.includes(styleID)) ||
                            (typeof parser.style === "string" && parser.style === styleID)) {
                            self.calc({ value: parser.generate(computed[styleID]), id: styleID, element: node });
                            return true;
                        }
                        return false;
                    });
                }
            }
            walk(container, generateListeners);
        };
        this.setWatchedStyles = () => {
            const watchedStyles = [];
            for (const parser of this.parsers) {
                if (Array.isArray(parser.style)) {
                    for (const style of parser.style) {
                        if (!watchedStyles.includes(style))
                            watchedStyles.push(style);
                    }
                }
                else {
                    if (!watchedStyles.includes(parser.style))
                        watchedStyles.push(parser.style);
                }
            }
            this.watchedStyles = watchedStyles;
        };
        if (!params.autoScaleAxis)
            params.autoScaleAxis = "both";
        if (!params.autoScaleBy)
            params.autoScaleBy = "body";
        if (!params.resizeMethod)
            params.resizeMethod = "calculate";
        if (!params.clearStalledTimeout)
            params.clearStalledTimeout = ContentResizer.DEFAULT_STALLED_TIMEOUT;
        this.params = params;
        this.addParser(parser);
        this.addParser(parserMatrix);
        if (this.params.autogenerate)
            this.autoGenerate();
        if (!this.params.width) {
            this.params.width = this.params.container.offsetWidth;
        }
        if (!this.params.height) {
            this.params.height = this.params.container.offsetHeight;
        }
        if (this.params.autoScaleBy && this.params.autoScaleBy !== "none") {
            this.resize();
            switch (this.params.autoScaleBy) {
                case "body":
                    window.addEventListener("resize", this.resize);
                    break;
                case "parent":
                    const parent = this.params.container.parentNode;
                    if (parent && ContentResizer.ResizeObserver) {
                        const ro = new ContentResizer.ResizeObserver(() => this.resize());
                        ro.observe(parent);
                    }
            }
        }
    }
    static setResizeObserverPolyfill(polyfill) {
        ContentResizer.ResizeObserver = polyfill;
    }
    static clone(data) {
        return JSON.parse(JSON.stringify(data));
    }
    getParserById(id, clone) {
        const targetParser = this.parsers.find(parser => parser.id === id);
        if (!targetParser)
            return false;
        if (clone)
            return JSON.parse(JSON.stringify(targetParser));
        else
            return targetParser;
    }
    setParserById(parser, setId) {
        const id = setId || parser.id;
        for (const i in this.parsers) {
            if (this.parsers[i].id === id)
                this.parsers[i] = parser;
        }
        this.setWatchedStyles();
    }
}
ContentResizer.DEFAULT_STALLED_TIMEOUT = 1000;
ContentResizer.ResizeObserver = window["ResizeObserver"];

export default ContentResizer;
