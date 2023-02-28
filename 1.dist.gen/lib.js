import { intersection, Log } from '../deps.js'
import settings from '../settings.js'
// const LOG = (...t) => preLOG('MATCH', ...t)
// const unknown = '-'
const log = new Log('match.type')

function calculateDistanceBetweenTwoSequences(s1, s2, minTotal = 100) {
	let diff = 0
	let total = 0
	for (let pos in s1) {
		// if (s1[pos] == settings.unknown) continue
		// if (s2[pos] == settings.unknown) continue
		if (!s1[pos]) continue
		if (!s2[pos]) continue
		total += 1
		if (s1[pos] != s2[pos])
			diff += 1
	}
	// console.log('dist',total,minTotal)
	if (total > minTotal) return diff
}



export function calculateDistanceMatrix(input = {}, germID) {
	// console.log(input)
	let output = {}
	let keys = new Set(Object.keys(input[Object.keys(input)[0]]))
	let minTotal = Math.round(keys.size / 4)
	let i
	let ids = Object.keys(input).sort()
	console.log("IDS", ids)
	for (let id1 of ids) {
		let t0 = new Date()
		log.info(germID, id1, i ?? 'x', '/', Object.keys(input).length,t0)
		output[id1] ??= {}
		i = 0
		for (let id2 of ids) {
			output[id2] ??= {}
			if (output?.[id1]?.[id2] !== undefined) continue // skip this id-combo if it has a calculation-result already
			if (id1 == id2) {
				output[id1][id2] = ""
				continue
			}
			i++
			let dist = calculateDistanceBetweenTwoSequences(input[id1], input[id2], minTotal)
			output[id1][id2] = dist
			output[id2][id1] = dist
		}
	}
	return output
}




export function groupDistanceMatrixByPatientID(matrix, metaData) {
	let output = {}
	let sampleIDs = Object.keys(matrix).sort()
	// let pairs = {}

	// group cross-match by patientID into arrays
	for (let sid1 of sampleIDs) {
		// console.log(new Date().toISOString().slice(11, 19), 'groupBy patientID', `${sampleIDs.indexOf(sid1) + 1}/${sampleIDs.length}`, sid1)
		let pid1 = metaData[sid1]?.patientID
		// if(!pid1) continue
		if (pid1 == undefined) continue
		// console.log('pid1',pid1)
		if (!output[pid1]) output[pid1] = {}
		for (let sid2 of sampleIDs) {
			let pid2 = metaData[sid2]?.patientID
			if (!pid2) continue
			if (pid1 == pid2) {
				output[pid1][pid2] = ""
				continue
			}
			let dist = matrix[sid1][sid2]
			if (dist === undefined) continue
			if (!output[pid1][pid2]) output[pid1][pid2] = []
			// if (dist == '') continue
			// dist *= 1
			// } else {

			// }
			// if (dist != settings.unknown) dist *= 1
			dist *= 1
			output[pid1][pid2].push(dist)

			// let pair = [pid1, pid2].sort().join('-')
			// if (pairs[pair] == undefined || dist < pairs[pair])
			// 	pairs[pair] = dist
			// output[pid2][pid1].push(dist)
		}
	}

	// sort and join arrays for saving
	for (let pid1 in output) {
		for (let pid2 in output[pid1]) {
			if (output[pid1][pid2])
				output[pid1][pid2] = output[pid1][pid2].sort((a, b) => a - b).join('|') || undefined
		}
	}


	return output
}






export function filter(data, DIST = 20) {
	let out = {}
	for (let pid1 in data) {
		for (let pid2 in data[pid1]) {
			if(pid1==pid2) continue
			let dist = data[pid1][pid2]?.split('|')?.map(x => x * 1)?.sort((a, b) => a - b)?.[0]
			// console.log(pid1,pid2,dist)
			if (dist > DIST) continue
			out[pid1] ??= {}
			out[pid1][pid2] = dist
		}
	}
	return out
}



