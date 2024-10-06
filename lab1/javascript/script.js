import {RGB, HSV, CMYK} from "./colors.js"

let globalColor = new RGB(0, 0, 0)

let rgb = new RGB(0, 0, 0)
let hsv = new HSV(0, 0, 0)
let cmyk = new CMYK(0, 0, 0, 0)

rgb.fromRgb(globalColor)
hsv.fromRgb(rgb)
cmyk.fromRgb(rgb)

function filter(slider, input) {
	return e => {
		let v = parseFloat(e.target.value)
		if (v < slider[0]) {
			input.value = slider[0]
		} else if (v > slider[1]) {
			input.value = slider[1]
		}
		if (slider[2] >= 1) {
			input.value = Math.round(e.target.value)
		}
		if (input.value === '') {
			input.value = slider[0]
		}
		e.target.value = input.value
	}
}

function getFields(o) {
	let res = []
	for (let prop in o) {
		if (prop.length == 1) {
			res.push(prop)
		}
	}
	return res
}

let tiedFields = []

function to16(col) {
	let r = Number(col).toString(16)
	if (r.length === 1) {
		r = "0" + r
	}
	return r
}

function update(ignoredColor, ignoredInput) {
	if (ignoredColor !== "rgb") {
		rgb.fromRgb(globalColor)
	}
	if (ignoredColor !== "hsv") {
		hsv.fromRgb(globalColor)
	}
	if (ignoredColor !== "cmyk") {
		cmyk.fromRgb(globalColor)
	}
	for (let o of tiedFields) {
		if (o["input"].id !== ignoredInput.id) {
			o["input"].value = parseFloat(o["object"][o["fieldName"]])
		}
	}
	document.getElementById('selector').value = '#' +
        to16(globalColor.r) +
        to16(globalColor.g) +
        to16(globalColor.b)
}

function getInput(color, fieldName) {
	let input = document.createElement("input")
	let slider = color.slider[fieldName]
	input.value = slider[0]
	input.type = "text"
	input.id = fieldName + color.colorName
	input.addEventListener("input", filter(slider, input))
	input.addEventListener("input", e => {
		if (isNaN(e.target.value) || isNaN(parseFloat(e.target.value))) {
			e.target.value = slider[0]
			input.value = slider[0]
		}
		color[fieldName] = parseFloat(e.target.value)
		globalColor.fromRgb(color.toRgb())
		update(color.colorName, input)
	})
	input.step = slider[2]
	let label = document.createElement("label")
	label.for = input.id
	label.textContent = fieldName + ': '
	let docSlider = document.createElement("input")
	docSlider.min = slider[0]
	docSlider.max = slider[1]
	docSlider.step = slider[2]
	docSlider.type = "range"
	docSlider.id = fieldName + color.colorName + "range"
	docSlider.addEventListener("input", e => {
		color[fieldName] = parseFloat(e.target.value).toFixed(2)
		globalColor.fromRgb(color.toRgb())
		update(color.colorName, docSlider)
	})
	docSlider.value = slider[0]
	let div = document.createElement("div")
	div.append(label, input, docSlider)
	tiedFields.push({
		"object": color,
		"fieldName": fieldName,
		"input": input
	})
	tiedFields.push({
		"object": color,
		"fieldName": fieldName,
		"input": docSlider
	})
	div.classList.add("selector-row")
	return div
}

function getInfo(color) {
	let fields = getFields(color)
	let div = document.createElement("div")
	for (let field of fields) {
		div.append(getInput(color, field))
	}
	return div
}

document.getElementById("rgb").appendChild(getInfo(rgb))
document.getElementById("hsv").appendChild(getInfo(hsv))
document.getElementById("cmyk").appendChild(getInfo(cmyk))

document.getElementById("selector").addEventListener(
	"input",
	value => {
		let color = value.target.value
		globalColor.r = parseInt(color.substring(1, 3), 16)
		globalColor.g = parseInt(color.substring(3, 5), 16)
		globalColor.b = parseInt(color.substring(5, 7), 16)
		update(globalColor, {id: undefined})
	}
)
