class Color {

	colorName

	toRgb() {
		return new RGB(0, 0, 0)
	}

	fromRgb() {}

	constructor(colorName) {
		this.colorName = colorName
	}
}

class RGB extends Color {

	r
	g
	b

	slider = {
		"r": [0, 255, 1],
		"g": [0, 255, 1],
		"b": [0, 255, 1]
	}

	constructor(r, g, b) {
		super('rgb')
		this.r = r
		this.g = g
		this.b = b
		while (this.r < 0) {
			this.r += 255
		}
		while (this.g < 0) {
			this.r += 255
		}
		while (this.b < 0) {
			this.r += 255
		}
	}

	fromRgb(rgb) {
		this.r = Math.round(rgb.r)
		this.g = Math.round(rgb.g)
		this.b = Math.round(rgb.b)
	}

	toRgb() {
		return this
	}
}

class CMYK extends Color {

	c
	m
	y
	k

	slider = {
		"c": [0, 1, 0.01],
		"m": [0, 1, 0.01],
		"y": [0, 1, 0.01],
		"k": [0, 0.99, 0.01]
	}

	constructor(c, m, y, k) {
		super("cmyk")
		this.c = c
		this.m = m
		this.y = y
		this.k = k
	}

	toRgb() {
		return new RGB(
			255 * (1 - this.c) * (1 - this.k),
			255 * (1 - this.m) * (1 - this.k),
			255 * (1 - this.y) * (1 - this.k)
		)
	}

	fromRgb(rgb) {
		let r = rgb.r / 255
		let g = rgb.g / 255
		let b = rgb.b / 255
		this.k = Math.min(this.slider['k'][1], 1 - Math.max(r, g, b))
		this.c = (1 - r - this.k) / (1 - this.k)
		this.m = (1 - g - this.k) / (1 - this.k)
		this.y = (1 - b - this.k) / (1 - this.k)
	}
}

class HSV extends Color {

	h
	s
	v

	slider = {
		"h": [0, 0.99, 0.01],
		"s": [0, 0.99, 0.01],
		"v": [0, 0.99, 0.01]
	}

	constructor(h, s, v) {
		super("hsv")
		this.h = h
		this.s = s
		this.v = v
	}

	toRgb() {
		let i = Math.floor(this.h * 6)
		let f = this.h * 6 - i
		let p = this.v * (1 - this.s)
		let q = this.v * (1 - f * this.s)
		let t = this.v * (1 - (1 - f) * this.s)
		var r, g, b
		switch (i % 6) {
			case 0: r = this.v, g = t, b = p; break
			case 1: r = q, g = this.v, b = p; break
			case 2: r = p, g = this.v, b = t; break
			case 3: r = p, g = q, b = this.v; break
			case 4: r = t, g = p, b = this.v; break
			case 5: r = this.v, g = p, b = q; break
		}
		r *= 255
		g *= 255
		b *= 255
		return new RGB(r, g, b)
	}

	fromRgb(rgb) {
		let max = Math.max(rgb.r, rgb.g, rgb.b)
		let min = Math.min(rgb.r, rgb.g, rgb.b)
		let d = max - min
		let s = (max === 0 ? 0 : d / max)
		let v = max / 255
		var h
		switch (max) {
			case min: h = 0; break
			case rgb.r: h = (rgb.g - rgb.b) + d * (rgb.g < rgb.b ? 6 : 0); h /= 6 * d; break
			case rgb.g: h = (rgb.b - rgb.r) + d * 2; h /= 6 * d; break
			case rgb.b: h = (rgb.r - rgb.g) + d * 4; h /= 6 * d; break
		}
		this.h = h
		this.s = s
		this.v = v
	}
}



export {RGB, HSV, CMYK}
