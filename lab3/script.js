const Algo = {
	Step: "step",
	Bresehnam: "bresenham",
	DDA: "dda",
	Circle: "circle",
}

class Grid {
	constructor(scale, canvas) {
		this._scale = scale
		this._canvas = canvas
		this._renderingContext = canvas.getContext('2d')
		this._drawGrid()
		this._canvas.addEventListener('click', this._clickListener(), false);
	}

	_scale
	_x = 0
	_y = 0
	_numbersSize = 10
	_xOffset
	_height
	_createdPoints = new Set()
	_manuallyClicked = []
	_rendering = undefined

	_drawGrid() {
		this._renderingContext.clearRect(0, 0, this._canvas.width, this._canvas.height)
		this._renderingContext.font = this._numbersSize.toString() + 'px serif'
		const m = Math.floor(this._canvas.height / this._scale)
		const xOffset = this._renderingContext.measureText(m.toString())
		// console.log(xOffset)
		this._xOffset = xOffset.width
		this._drawSquares(this._canvas.width - xOffset.width, this._canvas.height - this._numbersSize)
		this._drawDigits([xOffset.width, this._canvas.height - this._numbersSize])
		this._height = this._canvas.height - this._numbersSize
	}

	_drawSquares(width, height) {
		let ctx = this._canvas.getContext('2d')
		let xOffset = this._canvas.width - width
		const m = height / this._scale
		const n = width / this._scale
		for (let i = 0; i < m; ++i) {
			for (let j = 0; j < n; ++j) {
				ctx.strokeRect(xOffset + j * this._scale, height - (i + 1) * this._scale, this._scale, this._scale)
			}
		}
	}

	_drawDigits(zero) {
		const [x, y] = zero
		const m = Math.floor(y / this._scale)
		const n = Math.floor((this._canvas.width - x) / this._scale)
		for (let i = 0; i < m; ++i) {
			this._renderingContext.fillText((i + this._y).toString(), 0, y - i * this._scale - (this._scale - this._numbersSize) / 2)
		}
		for (let i = 0; i < n; ++i) {
			this._renderingContext.fillText((i + this._x).toString(), i * this._scale + (this._scale + x) / 2, this._canvas.height)
		}
	}

	_getRectCoords(x, y) {
		return [this._xOffset + x * this._scale, this._height - (y + 1) * this._scale]
	}

	_getRectCoordsFromClick(x, y) {
		return [
			Math.floor((x - this._xOffset) / this._scale),
			Math.floor((this._height - y) / this._scale)
		]
	};

	_clickListener() {
		const self = this
		return async e => {
			if (self._rendering !== undefined) {
				await self._rendering
			}
			if (self._manuallyClicked.length === 2) {
				let toRemove = []
				for (let created of self._createdPoints) {
					let s = created.split(' ')
					let x = parseInt(s[0])
					let y = parseInt(s[1])
					toRemove.push([x, y])
				}
				for (let p of toRemove) {
					self.clearPixel(...p)
				}
				self._manuallyClicked = []
			}
			const rect = this._canvas.getBoundingClientRect()
			if (e.x - rect.left <= this._xOffset || e.y - rect.top > this._height) {
				return
			}
			let [x, y] = self._getRectCoordsFromClick(e.x - rect.left, e.y - rect.top)
			self._manuallyClicked.push({ 'x': x, 'y': y })
			if (this._createdPoints.has(x.toString() + ' ' + y.toString())) {
				self.clearPixel(x, y)
			} else {
				self.setPixel(x, y)
			}
			if (self._manuallyClicked.length === 2) {
				if (this._algo == Algo.Bresehnam) {
					this._rendering = bresenhamAlgorithm(self._manuallyClicked[0], self._manuallyClicked[1], this._sleepTime)
				} else if (this._algo == Algo.Step) {
					this._rendering = drawLineBySteps(self._manuallyClicked[0], self._manuallyClicked[1], this._sleepTime, this._step)
				} else if (this._algo == Algo.DDA) {
					this._rendering = ddaAlgorithm(self._manuallyClicked[0], self._manuallyClicked[1], this._sleepTime)
				} else if (this._algo == Algo.Circle) {
					this._rendering = circleAlgorithm(self._manuallyClicked[0], self._manuallyClicked[1], this._sleepTime)
				}
				await this._rendering
				this._rendering = undefined
			}
		}
	}

	width() {
		return this._canvas.width - this._xOffset
	}

	height() {
		return this._height
	}

	setPixel(x, y) {
		if (x < 0 || y < 0) {
			return
		}
		const [xRect, yRect] = this._getRectCoords(x, y)
		this._renderingContext.fillRect(xRect, yRect, this._scale, this._scale)
		this._createdPoints.add(x.toString() + ' ' + y.toString())
	}

	clearPixel(x, y) {
		if (x < 0 || y < 0) {
			return
		}
		const [xRect, yRect] = this._getRectCoords(x, y)
		this._renderingContext.clearRect(xRect, yRect, this._scale, this._scale)
		this._renderingContext.strokeRect(xRect, yRect, this._scale, this._scale)
		this._createdPoints.delete(x.toString() + ' ' + y.toString())
	}

	async setStart(x, y) {
		if (isNaN(x) || isNaN(y)) {
			return
		}
		if (this._rendering !== undefined) {
			await this._rendering
		}
		let temp = new Set()
		for (let p of this._createdPoints) {
			let spl = p.split(' ')
			let val = (parseInt(spl[0]) + this._x - x).toString() + ' ' + (parseInt(spl[1]) + this._y - y).toString()
			temp.add(val)
		}
		this._createdPoints = temp
		this._x = x
		this._y = y
		this._drawGrid()
		for (let p of this._createdPoints) {
			let spl = p.split(' ')
			this.setPixel(parseInt(spl[0]), parseInt(spl[1]))
		}
	}

	async setScale(newScale) {
		if (this._rendering !== undefined) {
			await this._rendering
		}
		this._scale = newScale
		this._drawGrid()
		for (let p of this._createdPoints) {
			let spl = p.split(' ')
			this.setPixel(parseInt(spl[0]), parseInt(spl[1]))
		}
	}

	async setSleepTime(value) {
		if (this._rendering !== undefined) {
			await this._rendering
		}
		this._sleepTime = value
	}

	async setStep(value) {
		if (this._rendering !== undefined) {
			await this._rendering
		}
		this._step = value
	}

	useBresenham() {
		this._algo = Algo.Bresehnam
	}

	useByStep() {
		this._algo = Algo.Step
	}

	useDDA() {
		this._algo = Algo.DDA
	}

	useCircle() {
		this._algo = Algo.Circle
	}

	_canvas
	_renderingContext

	_sleepTime = 100
	_step = 0.1
	_algo = Algo.Step
}

let grid = new Grid(
	50, document.getElementById('canvas')
)

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function drawLineBySteps(start, end, sleepTime = 100, step = 0.01) {
	if (start.x === end.x) {
		if (start.y > end.y) {
			return drawLineBySteps(end, start, sleepTime, step)
		}
		for (let i = start.y; i <= end.y; ++i) {
			await timeout(sleepTime)
			grid.setPixel(start.x, i)
		}
		return;
	}
	const dx = end.x - start.x
	const dy = end.y - start.y
	const k = dy / dx
	const b = (end.x * start.y - start.x * end.y) / dx
	const draw = async x => {
		grid.setPixel(Math.floor(x), Math.floor(k * x + b))
		await timeout(sleepTime * step)
	}
	if (start.x < end.x) {
		for (let i = start.x; i < end.x; i += step) {
			await draw(i)
		}
	} else {
		for (let i = start.x; i > end.x; i -= step) {
			await draw(i)
		}
	}
}

class Translator {
	translate(x, y) {
		return [x, y]
	}
}

class SwapCoordsTranslator extends Translator {
	translate(x, y) {
		return [y, x]
	}
}

class MirrorTranslator extends Translator {
	constructor(mirrorX, mirrorY) {
		super()
		this._x = mirrorX ? -1 : 1
		this._y = mirrorY ? -1 : 1
	}

	_x
	_y

	translate(x, y) {
		return [x * this._x, y * this._y]
	}
}

class ComposeTranslator extends Translator {
	constructor(translators) {
		super()
		this._translators = translators;
	}

	_translators

	translate(x, y) {
		let c = [x, y]
		for (let t of this._translators) {
			c = t.translate(...c)
		}
		return c
	}

	reverse(x, y) {
		let c = [x, y]
		this._translators.reverse()
		for (let t of this._translators) {
			c = t.translate(...c)
		}
		this._translators.reverse()
		return c
	}
}

async function circleAlgorithm(center, point, sleepTime = 100) {
	let x1 = center.x;
	let y1 = center.y;
	let dx = point.x - center.x;
	let dy = point.y - center.y;
	let r = Math.round(Math.sqrt(dx * dx + dy * dy));
	let x = 0;
	let y = r;
	let delta = 1 - 2 * r;
	let error = 0;
	async function drawPixel(x, y) {
		await timeout(sleepTime)
		grid.setPixel(x, y)
	}
	while (y >= x) {
		await drawPixel(x1 + x, y1 + y)
		await drawPixel(x1 + x, y1 - y)
		await drawPixel(x1 - x, y1 + y)
		await drawPixel(x1 - x, y1 - y)
		await drawPixel(x1 + y, y1 + x)
		await drawPixel(x1 + y, y1 - x)
		await drawPixel(x1 - y, y1 + x)
		await drawPixel(x1 - y, y1 - x)
		error = 2 * (delta + y) - 1
		if (delta < 0 && error <= 0) {
			x += 1
			delta += 2 * x + 1
			continue
		}
		if (delta > 0 && error > 0) {
			y -= 1
			delta -= 2 * y + 1
			continue
		}
		x += 1
		y -= 1
		delta += 2 * (x - y)
	}
}

async function ddaAlgorithm(start, end, sleepTime = 100) {
	let dx = end.x - start.x;
	let dy = end.y - start.y;
	let steps = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
	let x = start.x;
	let y = start.y;
	let sx = dx / steps;
	let sy = dy / steps;
	for (let i = 0; i < steps; ++i) {
		await timeout(sleepTime)
		grid.setPixel(Math.round(x), Math.round(y));
		x += sx;
		y += sy;
	}
}

async function bresenhamAlgorithm(start, end, sleepTime = 100) {
	let dx = end.x - start.x
	if (dx === 0) {
		return drawLineBySteps(start, end, sleepTime, 0.01)
	}
	let dy = end.y - start.y
	let k = dy / dx
	let translators = [new Translator()]
	if (Math.abs(k) > 1) {
		k = 1 / k
		translators.push(new SwapCoordsTranslator())
		dx = dy
	}
	if (k > 0 && dx < 0) {
		translators.push(new MirrorTranslator(true, true))
	} else if (k < 0) {
		if (dx < 0) {
			translators.push(new MirrorTranslator(true, false))
		} else {
			translators.push(new MirrorTranslator(false, true))
		}
	}
	let translator = new ComposeTranslator(translators)
	let [startX, startY] = translator.translate(start.x, start.y)
	let [endX, endY] = translator.translate(end.x, end.y)
	dy = endY - startY
	dx = endX - startX
	let e = dy / dx - 0.5
	let y = startY
	for (let i = startX; i < endX; ++i) {
		if (e >= 0) {
			y += 1
			e += dy / dx - 1
		} else {
			e += dy / dx
		}
		grid.setPixel(...translator.reverse(i, y))
		await timeout(sleepTime)
	}
}

async function updateCoordsX(e) {
	await grid.setStart(parseInt(e.target.value), grid._y)	
}

async function updateCoordsY(e) {
	await grid.setStart(grid._x, parseInt(e.target.value))	
}

async function updateScale(e) {
	await grid.setScale(parseInt(e.target.value))
	document.getElementById('range-value').innerText = e.target.value
}

async function updateSleepTime(e) {
	await grid.setSleepTime(parseInt(e.target.value))
	document.getElementById('sleep-value').innerText = e.target.value + 'мс'
}

async function updateStep(e) {
	await grid.setStep(parseFloat(e.target.value) / 100)
	document.getElementById('step-value').innerText = e.target.value + '%'
}

async function updateAlgo(s) {
	if (s.value === 'step') {
		await grid.useByStep()
	} else if (s.value === 'bresenham') {
		await grid.useBresenham()
	} else if (s.value === 'dda') {
		await grid.useDDA()
	} else if (s.value == 'circle') {
		await grid.useCircle()
	} else {
		await grid.useBresenham()
	}
}

document.getElementById('x0').addEventListener('input', updateCoordsX)
document.getElementById('y0').addEventListener('input', updateCoordsY)
document.getElementById('scale-slider').addEventListener('input', updateScale)
document.getElementById('sleep-slider').addEventListener('input', updateSleepTime)
document.getElementById('step-slider').addEventListener('input', updateStep)
