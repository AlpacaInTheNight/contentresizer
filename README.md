

# Content resizer helper libratry

A small library to simplify scaling the size of content depending on the size of the window or parent node.

I wrote this lib to simplify the fitting of the content of simple HTML5 games working without canvas, but for other content fitting tasks, it can also be useful.

## Usage

Import the ContentResizer class (or load from the global scope for browser environment) and instantiate it.
It takes the following constructor parameters

#### `resizeMethod?: "transform" | "calculate" | "none";`
A method that will be used to resize the target container. One of possible:
`transform` - will set container scale via transform: scale CSS style. You probably don't need a library to do that, but it is still supported.
`calculate` - default method. Will calculate supported style values. Intended to be used with the calc() method.
`none` - will do nothing.

#### `autoScaleBy?: "none" | "body" | "parent";`
Determine the wrapper by the size of which the target container will be scaled to fill it.
`body` - default. Will track the size of the body tag.
`parent` - will track the size of the parent node. This requires the support of the Resize Observer or a provided polyfill.
`none` - will do nothing.

#### `autoScaleAxis?: "both" | "width" | "height";`
The axis on which scale will be calculated. Default is set to both.

#### `autogenerate?: boolean;`
If set to true - will create style resizers for the "calculate" method automatically.

#### `width?: number;`
The initial width of the target container. If not set - offsetWidth will be assigned for it.

#### `height?: number;`
The initial height of the target container. If not set - offsetHeight will be assigned for it.

#### `container: HTMLElement;`
Target container to be scaled to its wrapper container bounds.

#### `clearStalledTimeout?: number;`
Since calculate method caches elements which styles it tracks
they need to be freed from cache after they are being remove from the document.
This param set timeout in ms beetween cache clearing from the removed dom element after the new style recalucalation request.
By default is 1s.
  
Autoscale by wrapper width of target container by recalculating style values
```javascript
const resizer = new ContentResizer({
  width: 400,
  height: 200,
  container: target,
  autoScaleBy: "parent",
  autoScaleAxis: "width"
});
  
resizer.calc({
  value: 400,
  id: "width",
  element: target,
  options: {max: 800, min: 200}
});
```
  
Autoscale by page body keeping original container sides ratio of target container using transform method
```javascript
const resizer = new ContentResizer({
  resizeMethod: "transform",
  width: 400,
  height: 200,
  container: target,
  autoScaleBy: "body"
});
```
  
## Methods

#### `static setResizeObserverPolyfill(polyfill: any): void;`
Sets polyfill for Resize Observer.
If you want to user "parent" as a target of auto scaling you would like to provide this polyfill.
See current support at [Caniuse](https://caniuse.com/#feat=resizeobserver)  
I recommend [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill)


#### `setScale: (scale: number) => void;`
Manually sets scale of the target container

#### `updateContainerScale: () => void;`
Updates scale according to the selected wrapper size.
It is called automatically on wrapper resize, so in most cases you wont need this.

#### `updateListenedElements: () => void;`
Cycles through this.cachedResizeTargets and updates cached element's listened styles.
Called automatically when new scale is being set.

#### `calc: (calcParams: CalculateParams) => string;`
Sets to target element and returns scaled style value based on provided params.
If the resize method is set to "calculate" it will listens to the change of the scale and automatically update values.
If the DOM element is already present in the cache - it will update it instead of creating an extra copy.

##### Calculate params
##### `value: number | string | (number | string)[] | false;`
Base value of the style.

##### `id: string;`
Javascript name of the style.

##### `element: HTMLElement;`
Link to dom element containing target style.

##### `options?: ResizedListenerOptions;`
Currently supports fallowing options:

##### `min?: number | number[]`
Sets minimal value or values.

##### `max?: number | number[];`
Sets maximum value or values.

##### Examples
```javascript
resizer.calc({
  value: 400,
  id: "width",
  element: target,
  options: {max: 800, min: 200}
});

resizer.calc({
  value: [10, 5, 20, 20],
  id: "padding",
  element: text,
  options: {max: [40, 10, 20, 20]}
});

resizer.calc({
  value: [1, "white"],
  id: "webkitTextStroke",
  element: header
});
```

#### `removeStalledLinks: () => void;`
Frees removed dom elements from memory.

## Style formatters

When `calc` is being called, it checks style id and searches for a style formatter that supports this style. It calls the formatter `calculate` method if it supports the target style.


### Style formatter specification

#### `id: string;`
Unique id for the formatter object.

#### `style: string | string[];`
CSS style or an array of styles in Javascript format that formatter must handle.

#### `calculate: (value: number | string | (number | string)[] , scale: number, options?: ResizedListenerOptions) => string;`
Function that will be called by the calc method for specific styles. See `calc` method for the description.

#### `generate: (styleValue: string) => string | number | (string | number)[] | false;`
Function that will be called for the specific style when `autogenerate` param is set to true. Gets CSS style value and returns its parsed value that a calculate function expects to receive.

### Methods for working with style formatters

#### `getFormatters: (clone?: boolean | undefined) => StyleFormatter[];`
Returns array of style formatters. If called with the true param will return clone.

#### `setFormatters: (formatters: StyleFormatter[]) => void;`
Sets array of style formatters.

#### `getFormatterById(id: string, clone?: boolean): StyleFormatter | false;`
Returns style formatter by id. If second param is set to true will return clone.

#### `setFormatterById(formatter: StyleFormatter): void;`
Updates formatter.

#### `addFormatter: (formatter: StyleFormatter) => void;`
Registers new formatter.

### Base formatters

#### General
Listens to styles that are formed as a value or a list of values separated by a space.

#### Matrix
Handles `transform` style.
