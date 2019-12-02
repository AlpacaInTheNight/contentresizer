

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
The axis on which scale will be calculated.

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
Returns scaled style value based on provided params.
If the resize method is set to "calculate" it will listens to the change of the scale and automatically update values.
If the DOM element is already present in the cache - it will update it instead of creating an extra copy.

##### Calculate params
`value: number | string | (number | string)[] | false;`
Base value of the style.

##### `id: string;`
Javascript name of the style

##### `element: HTMLElement;`
Link to dom element containing target style

##### `options?: ResizedListenerOptions;`
Currently supports fallowing options:

##### `min?: number | number[]`
Sets minimal value or values

##### `max?: number | number[];`
Sets maximum value or values

##### Examples
```javascript
target.style.width = calc({
  value: 400,
  id: "width",
  element: target,
  options: {max: 800, min: 200}
});

text.style.padding = calc({
  value: [10, 5, 20, 20],
  id: "padding",
  element: text,
  options: {max: [40, 10, 20, 20]}
});

header.style.webkitTextStroke = calc({
  value: [1, "white"],
  id: "webkitTextStroke",
  element: header
});
```

#### `removeStalledLinks: () => void;`
Frees removed dom elements from memory