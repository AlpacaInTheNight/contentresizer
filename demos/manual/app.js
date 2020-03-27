const target = document.getElementById("container");
const header = target.querySelector("h1");
const text = target.querySelector("#child");

const parent = document.getElementById("parent");
const scaleMe = document.getElementById("scaleMe");
const resizeMe = document.getElementById("resizeMe");
const scaleInput = document.getElementById("scale");
const translate = document.getElementById("translate");

const resizer = new ContentResizer({
	resizeMethod: "transform",
	width: 400,
	height: 200,
	container: target,
	autoScaleBy: "parent",
	autoScaleAxis: "width"
});

const {calc} = resizer;
const generalParser = resizer.getParserById("general");
if(!generalParser.style.includes("webkitTextStroke")) generalParser.style.push("webkitTextStroke");

target.style.backgroundColor = "magenta";
calc({value: 400, id: "width", element: target, options: {max: 800, min: 200}});
calc({value: 200, id: "height", element: target});

calc({value: 30, id: "fontSize", element: header});
calc({value: [1, "white"], id: "webkitTextStroke", element: header});
calc({value: 15, id: "fontSize", element: text});
text.style.backgroundColor = "grey";
calc({value: [10, 5, 20, 20], id: "padding", element: text, options: {max: [40, 10, 20, 20], min: [5, 5, 10, 10]}});

translate.style.position = "absolute";
translate.style.backgroundColor = "red";

calc({value: [150, 10], id: "transform", element: translate, options: {max: [570, 0], min: [100, 0]}});
calc({value: 50, id: "width", element: translate, options: {max: 200}});
calc({value: 50, id: "height", element: translate, options: {max: 200}});

scaleMe.addEventListener("click", () => resizer.setScale( parseFloat(scaleInput.value) ));
resizeMe.addEventListener("click", () => {parent.style.width = "70%"});
