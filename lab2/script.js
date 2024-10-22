function aggregateChannels(image, statistic) {
	let res = Array(image.channels)
	for (let c = 0; c < image.channels; ++c) {
		res[c] = image.getPixelXY(0, 0)[c]
	}
	for (let c = 0; c < image.channels; ++c) {
		for (let i = 0; i < image.width; ++i) {
			for (let j = 0; j < image.height; ++j) {
				res[c] = statistic(res[c], image.getPixelXY(i, j)[c])
			}
		}
	}
	return res
}

function linearContrasting(image) {
	let mins = aggregateChannels(image, Math.min)
	let maxs = aggregateChannels(image, Math.max)
	let result = IJS.Image.createFrom(image)

	for (let i = 0; i < image.width; ++i) {
		for (let j = 0; j < image.height; ++j) {
			let pixels = Array(image.channels)
			for (let c = 0; c < image.channels; ++c) {
				let diff = maxs[c] - mins[c]
				if (diff !== 0) {
					pixels[c] = Math.floor(255 * (image.getPixelXY(i, j)[c] - mins[c]) / diff)
				} else {
					pixels[c] = result.getPixelXY(i, j)[c]
				}
			}
			result.setPixelXY(i, j, pixels)
		}
	}
	return result
}

function median(array) {
	array.sort((a, b) => a - b)
	return array[Math.floor(array.length / 2)]
}

function max(array) {
	let res = undefined
	for (let i of array) {
		if (res === undefined) {
			res = i
		} else {
			res = Math.max(res, i)
		}
	}
	return res
}

function min(array) {
	let res = undefined
	for (let i of array) {
		if (res === undefined) {
			res = i
		} else {
			res = Math.min(res, i)
		}
	}
	return res
}

function getStatisticalPixel(image, statistics, y, x, kernel = 3) {
	let depth = image.channels
	let result = Array(depth)

	let p = Math.floor(kernel / 2)
	for (let c = 0; c < depth; ++c) {
		let pixels = []
		for (let i = -p; i <= p; ++i) {
			if (x + i < 0 || x + i >= image.width) {
				break
			}
			for (let j = -p; j <= p; ++j) {
				if (y + j < 0 || y + j >= image.height) {
					continue
				}
				pixels.push(image.getPixelXY(x + i, y + j)[c])
			}
		}
		result[c] = statistics(pixels)
	}
	return result
}

function statisticalFilter(image, statistics) {
	const w = image.width
	const h = image.height
	let result = IJS.Image.createFrom(image)
	for (let i = 0; i < h; ++i) {
		for (let j = 0; j < w; ++j) {
			result.setPixelXY(j, i, getStatisticalPixel(image, statistics, i, j))
		}
	}
	return result
}

function preprocImage(image) {
	let result = IJS.Image.createFrom(image)
	for (let x = 0; x < image.width; ++x) {
		for (let y = 0; y < image.height; ++y) {
			avg = image.getPixelXY(x, y).reduce((partialSum, a) => partialSum + a, 0);
			avg = avg / image.getPixelXY(x, y).length
			result.setPixelXY(x, y, [avg])
		}
	}
	return result
}

function getSlidingWindowStats(imageBW, i, j, windowSize, method) {
	let ans = undefined
	for (let x = i; x < i + windowSize; ++x) {
		for (let y = j; y < j + windowSize; ++y) {
			// avg = imageBW.getPixelXY(x, y).reduce((partialSum, a) => partialSum + a, 0);
			// avg = avg / imageBW.getPixelXY(x, y).length
			let avg = imageBW.getPixelXY(x, y)[0]
			if (ans === undefined) {
				ans = avg
			} else {
				ans = method(ans, avg)
			}
		}
	}
	return ans
}

function bernsenThreshold(image, windowSize = 15, contrastThreshold = 15, thresholValue = 127) {
	let offset = Math.floor(windowSize / 2)
	let result = IJS.Image.createFrom(image)
	let imageBW = preprocImage(image)
	for (let i = 0; i + windowSize < imageBW.width; ++i) {
		for (let j = 0; j + windowSize < imageBW.height; ++j) {
			let min = getSlidingWindowStats(imageBW, i, j, windowSize, Math.min)
			let max = getSlidingWindowStats(imageBW, i, j, windowSize, Math.max)
			let diff = max - min
			let mid = (max + min) / 2
			let value = undefined
			if (diff < contrastThreshold) {
				if (mid > thresholValue) {
					value = 255
				} else {
					value = 0
				}
			} else {
				avg = imageBW.getPixelXY(i + offset, j + offset)[0]
				if (avg > mid) {
					value = 255
				} else {
					value = 0
				}
			}
			result.setPixelXY(i + offset, j + offset, [value, value, value])
		}
	}
	return result
}

function getSlidingWindowMean(imageBW, i, j, windowSize) {
	let ans = 0.0
	for (let x = i; x < i + windowSize; ++x) {
		for (let y = j; y < j + windowSize; ++y) {
			ans += imageBW.getPixelXY(x, y)[0]
		}
	}
	return ans / (windowSize * windowSize)
}

function getSlidingWindowVariance(imageBW, i, j, windowSize, avg) {
	let ans = 0.0
	for (let x = i; x < i + windowSize; ++x) {
		for (let y = j; y < j + windowSize; ++y) {
			ans += Math.pow(imageBW.getPixelXY(x, y)[0] - avg, 2)
		}
	}
	return Math.sqrt(ans / (windowSize * windowSize))
}

function niblackThreshold(image, windowSize = 15, k = -0.2) {
	let offset = Math.floor(windowSize / 2)
	let result = IJS.Image.createFrom(image)
	let imageBW = preprocImage(image)
	for (let i = 0; i + windowSize < imageBW.width; ++i) {
		for (let j = 0; j + windowSize < imageBW.height; ++j) {
			let mean = getSlidingWindowMean(imageBW, i, j, windowSize)
			let std = getSlidingWindowVariance(imageBW, i, j, windowSize, mean)
			let value = undefined
			if (imageBW.getPixelXY(i + offset, j + offset)[0] > mean + k * std) {
				value = 255
			} else {
				value = 0
			}
			result.setPixelXY(i + offset, j + offset, [value, value, value])
		}
	}
	return result

}

function pointwiseProcess(image, func) {
	let result = IJS.Image.createFrom(image)
	for (let i = 0; i < image.width; ++i) {
		for (let j = 0; j < image.height; ++j) {
			result.setPixelXY(i, j, func(image.getPixelXY(i, j)))
		}
	}
	return result
}

function updateImages(image) {
	document.getElementById('source').src = image.toDataURL()
	document.getElementById('linear-contrasting').src = linearContrasting(image).toDataURL()
	document.getElementById('bernsen').src = bernsenThreshold(image).toDataURL()
	document.getElementById('niblack').src = niblackThreshold(image).toDataURL()

	document.getElementById('exp').src = pointwiseProcess(image, (arr) => {
		res = []
		for (let i of arr) {
			res.push(Math.exp(i / 255) * (255 / Math.E))
		}
		return res
	}).toDataURL()
	document.getElementById('sqr').src = pointwiseProcess(image, (arr) => {
		res = []
		for (let i of arr) {
			res.push(Math.pow(i / 255, 2) * 255)
		}
		return res
	}).toDataURL()
	document.getElementById('sqrt').src = pointwiseProcess(image, (arr) => {
		res = []
		for (let i of arr) {
			res.push(Math.sqrt(i / 255) * 255)
		}
		return res
	}).toDataURL()
}

async function loadImage(path) {
	const fr = new FileReader()
	await fr.readAsArrayBuffer(path)
	fr.onload = (_) => {
		IJS.Image.load(fr.result).then(updateImages)
	}
}

document
	.getElementById('select-image')
	.addEventListener('input', async e => await loadImage(e.target.files[0]))
