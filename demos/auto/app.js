const target = document.getElementById("container");
const header = target.querySelector("h1");
const text = target.querySelector("#child");

const scaleMe = document.getElementById("scaleMe");
const scaleInput = document.getElementById("scale");
const translate = document.getElementById("translate");

const resizer = new Resizer({
	container: target,
	autogenerate: true
});

const {calc} = resizer;

scaleMe.addEventListener("click", () => resizer.setScale( parseFloat(scaleInput.value) ));
