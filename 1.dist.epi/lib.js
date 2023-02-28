import { TALI, select, Log, humanDuration } from '../deps.js'
import settings from '../settings.js'
// const LOG = (...t) => preLOG('match.epi', ...t)
const log = new Log('match.epi')

function contactBetweenTwoLocations(e1, e2) { }

function enhance(epi) {
	if (!epi.from) return false
	if (!epi.till) return false
	// console.log('till',epi.till)
	// if (epi.till?.startsWith?.('4000')) return false
	if (typeof epi.from == 'string') {
		epi.from = Date.parse(epi.from.replaceAll(' ', 'T')) / 1000
		epi.till = Date.parse(epi.till.replaceAll(' ', 'T')) / 1000
		// epi.from = Date.parse(epi.from.replaceAll(' ', 'T').split('T')[0]+'T00:00:00') / 1000
		// epi.till = Date.parse(epi.till.replaceAll(' ', 'T').split('T')[0]+'T23:59:59') / 1000
		// console.log('epi',epi)
	}
	return epi
}
function calculateOverlap(e1, e2) {
	if (e1.from > e2.till2 || e1.till < e2.from) {  // no time overlap, calculate distance instead
		let distance1 = Math.abs(e1.till - e2.from)
		let distance2 = Math.abs(e2.till - e1.from)
		return - Math.min(distance1, distance2)
	} else {  // calculate overlap in seconds
		let a = Math.max(e1.from, e2.from)
		let b = Math.min(e1.till, e2.till)
		return (b - a)
	}
}
function testLocationMatch(e1, e2, type, overlap, result) {
	let newValue
	if (e1[type] && e1[type] == e2[type]) {
		if (!result[type]) result[type] = {}
		let oldValue = result[type][e1[type]]
		newValue = overlap // assume oldValue is undefined
		if (oldValue !== undefined) {
			if (oldValue > 0 && overlap > 0) newValue = oldValue + overlap // sum up old and new values
			if (oldValue > 0 && overlap < 0) newValue = oldValue // keep old value
			if (oldValue < 0 && overlap > 0) newValue = overlap // use new overlap
			if (oldValue < 0 && overlap < 0) newValue = Math.max(oldValue, overlap) // use the bigger of the negative values
		} // else { like default }
		result[type][e1[type]] = newValue
		// if (type == 'clinic')
		// 	console.log('update', type, e1[type], oldValue, '->', newValue)
	}
	// console.log('new', newValue)
	return newValue
}
const DAY_SEC = 24 * 60 * 60
const MAX_DAYS = settings.app.maxTimegapInDays * DAY_SEC
export function contactBetweenTwoPatients(p1, p2) {
	let result = {}
	// console.log('match', p1.length, p2.length)
	for (let e1 of p1) {
		// console.log('e10', e1)
		e1 = enhance(e1)
		if (!e1) continue
		// console.log('e1', e1)
		for (let e2 of p2) {
			e2 = enhance(e2)
			if (!e2) continue
			let overlap = calculateOverlap(e1, e2)

			if (overlap < -MAX_DAYS) continue
			for (let type of ['clinic', 'ward', 'room']) {
				let res = testLocationMatch(e1, e2, type, overlap, result)
				// if (res && type == 'clinic')
				// if (res)
				// console.log('overlap', type, e1[type], e2[type], humanDuration(overlap))//, '\n', JSON.stringify(e1), '\n', JSON.stringify(e2), '\n',)
			}
			// if(e1.clinic && e1.clinic == e2.clinic) result[e1.clinic] = overlap
			// if(e1.from > e2.till) continue
			// if(e1.till < e2.from) continue
			// if()
			// contactBetweenTwoLocations(e1, e2)
		}
	}
	return result
}
export function crossMatch(tree, germID) {
	// let t0 = new Date()
	let output = {}
	let new_ids = Object.keys(tree).sort()//.slice(0,100)
	let old_ids = Object.keys(output).sort()
	let ids = new_ids.filter(x => !old_ids.includes(x))
	let all_ids = [...new Set([...old_ids, ...new_ids])]
	log.info(germID, new_ids.length, ':', old_ids.length, '->', ids.length)
	if (!ids.length) return output
	ids.map(id => { if (!output[id]) output[id] = {} })
	// console.log('ids',ids)
	for (let p1 of ids) {
		// log.timer()
		let t0 = Date.now()
		let epi1 = Object.values(tree[p1]).flatMap(x => Object.values(x))
		// console.log('epi', p1)
		// LOG('cross-match ').text(p1).tib.number(ids.indexOf(p1)).text('/').number(ids.length)
		// let comparisons = 0
		for (let p2 of all_ids) {
			let epi2 = Object.values(tree[p2]).flatMap(x => Object.values(x))
			if (p1 == p2) continue
			if (output?.[p1]?.[p2] !== undefined) continue
			// comparisons++
			let result = contactBetweenTwoPatients(epi1, epi2)
			if (Object.keys(result).length == 0) continue
			// if (Object.keys(result).length == 0) continue // CRITICAL... wieder einbauen?
			output[p1][p2] = result
			output[p2][p1] = result
		}
		log.info(p1, germID, ids.indexOf(p1) + 1, '/', ids.length, t0)
	}
	return output
}


export function* bigCrossMatch(tree) {
	let ids = Object.keys(tree).sort()//.slice(0,100)
	if (!ids.length) return output
	// ids.map(id => { if (!output[id]) output[id] = {} })

	log.info('flatten tree')
	for (let p in tree)
		tree[p] = Object.values(tree[p]).flatMap(x => Object.values(x))
	// console.log('ids',ids)
	for (let p1 of ids) {
		let output = {}
		// log.timer()
		let t0 = Date.now()
		// let epi1 = Object.values(tree[p1]).flatMap(x => Object.values(x))
		let epi1 = tree[p1]
		// console.log('epi', p1)
		// LOG('cross-match ').text(p1).tib.number(ids.indexOf(p1)).text('/').number(ids.length)
		// let comparisons = 0
		for (let p2 of ids) {
			// let epi2 = Object.values(tree[p2]).flatMap(x => Object.values(x))
			let epi2 = tree[p2]
			if (p1 == p2) continue
			// if (output?.[p1]?.[p2] !== undefined) continue
			// comparisons++
			let result = contactBetweenTwoPatients(epi1, epi2)
			if (Object.keys(result).length == 0) continue
			output[p2] = result
			// if (Object.keys(result).length == 0) continue // CRITICAL... wieder einbauen?
			// output[p1][p2] = result
			// output[p2][p1] = result
		}
		log.info(p1, ids.indexOf(p1) + 1, '/', ids.length, t0)
		yield [p1, output]
	}
	// return output
}


export function regroup(data) {
	let DAY = 24 * 60 * 60
	let out = { room: {}, ward: {}, clinic: {} }
	for (let pid1 in data) {
		for (let pid2 in data[pid1]) {
			for (let locType in data[pid1][pid2]) {
				// if (location != 'any' && location != locType) continue
				for (let [loc, dur] of Object.entries(data[pid1][pid2][locType])) {
					// console.log(pid1, pid2, locType, loc, dur)
					// out[locType] ??= {}
					out[locType][pid1] ??= {}
					dur = (dur / DAY).toFixed(2) * 1
					let old = out[locType][pid1][pid2]
					if (!old) {
						out[locType][pid1][pid2] = dur
					} else {
						if (old < 0 && dur < 0)
							out[locType][pid1][pid2] = Math.min(old, dur)
						if (old < 0 && dur > 0)
							out[locType][pid1][pid2] = dur
						if (old > 0 && dur > 0)
							out[locType][pid1][pid2] += dur
					}
					// if (old > 0 && dur < 0) // verfallen lassen
					// 	out[locType][pid1][pid2] += dur

					// if (dur < -duration * DAY) continue
					// out[pid1] ??= []
					// out[pid1].push(pid2)
					// out[pid1].sort()
				}
			}
		}
	}
	// console.log(out)
	return out
}



export function makeEpiTree(list) {
	// console.log(list)
	let tree = {}
	for (let [id, row] of Object.entries(list)) {
		// console.log('tree',id,row)
		// console.log('till',row.till)
		if (row.till.startsWith('4000')) continue
		if (!row.room) continue
		if (!row.patientID) continue
		let caseID = row.caseID ?? row.caseNumber
		if (!caseID) continue
		// console.log('tree',id,row)
		tree[row.patientID] ??= {}
		tree[row.patientID][caseID] ??= {}
		tree[row.patientID][caseID][id] ??= { ...select(row, 'from', 'till', 'clinic', 'ward', 'room') }
		// if (!tree[row.patientID]) tree[row.patientID] = {}
		// if (!tree[row.patientID][row.caseID]) tree[row.patientID][row.caseID] = {}
		// if (!tree[row.patientID][row.caseID][id]) tree[row.patientID][row.caseID][id] = { ...select(row, 'from', 'till', 'clinic', 'ward', 'room') }
	}
	// console.log(tree)
	return tree
}
