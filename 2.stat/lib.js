// export const filterKeys = (o, f) => Object.fromEntries(Object.entries(o).filter(([k, v]) => [f(k),v]))
export const filter = (o, f) => Object.fromEntries(Object.entries(o).filter(([k, v]) => f(k, v)))

export function calc(sequenceMatrix, contactMatrix, VARS = {}, KEY ) {
	// console.log('calc',)
	// const DEFAULT_VARS = { maxTimespanBetweenSequences: [90], maxTimespanBetweensContacts: [0], locationLayer: ['room'], maxContactDepth: [0] }
	// VARS = { ...DEFAULT_VARS, ...VARS }
	// console.log('seq',sequenceMatrix)
	// console.log('cg',cgmlstDist)
	// console.log(germ.name,"dist",JSON.stringify(distances).length)
	// console.log(distances)
	let output = { REL: {}, ABS: {} }
	for (let maxTimespanBetweenSequences of VARS.maxTimespanBetweenSequences) {
		let seq = seqDateFilter(sequenceMatrix, maxTimespanBetweenSequences)
		// console.log('seq',seq)
		let pat = type.groupDistanceMatrixByPatientID(seq.seq,seq.meta)
		pat = type.filter(pat,VARS.maxDistanceBetweenSequences)
		// console.log('pat',pat)
		let pairsAtDistance = cgmlstPairs(pat)
		// console.log('pairs',pairs)
		// statFolder.file('seq.tsv').text = TALI.grid.stringify(seq, { sortRows: true, sortCols: true })

		// continue
		for (let maxTimespanBetweensContacts of VARS.maxTimespanBetweensContacts) {
			for (let locationLayer of VARS.locationLayer) {
				let epiContacts = contactFilter(contactMatrix, locationLayer, maxTimespanBetweensContacts)
				// console.log('epiContacts',epiContacts)
				console.log('epiContacts', Object.keys(epiContacts).length)
				// console.log('epicon',epiContacts)
				for (let maxContactDepth of VARS.maxContactDepth) {
					let cgmlstPatients = new Set()
					for (let dist in pairsAtDistance) {
						// let cgmlstContacts = cgmlstFilter(cgmlstDist, dist)
						let cgmlstContacts = pairsAtDistance[dist]
						// console.log("DEBUG",cgmlstContacts)
						for (let p of cgmlstContacts.flat())
							cgmlstPatients.add(p)
						let epiContactsBelowCgmlst = filter(epiContacts, p => cgmlstPatients.has(p))
						for (let p in epiContactsBelowCgmlst)
							epiContactsBelowCgmlst[p] = epiContactsBelowCgmlst[p].filter(x => cgmlstPatients.has(x))
						// console.log('epiContactsBelowCgmlst', epiContactsBelowCgmlst)
						// console.log('cgmlstContacts',cgmlstContacts.flat())
						// console.log('cgmlstPatients',[...cgmlstPatients].sort())
						console.log('cgmlstPatients', cgmlstPatients.size)
						// console.log(germ.name, dist, "dist", Object.keys(distances).length)
						// if(deg>0) contacts = addContactDegree(contacts)
						console.log(KEY.toUpperCase(), `cgMLST-distance:${dist} | maxTimespanBetweensContacts:${maxTimespanBetweensContacts} | locationLayer:${locationLayer} | maxContactDepth: ${maxContactDepth}`)//, '---', JSON.stringify(VARS))
						let stat = { pairs: cgmlstContacts.length, contacts: 0 }
						for (let [pid1, pid2] of cgmlstContacts) {
							// let con = contactsForPID(epiContacts, pid1, deg)
							let t0 = Date.now()
							let con = contactsForPID(epiContactsBelowCgmlst, pid1, maxContactDepth)
							// console.log(pid1, pid2, 'contacts', con.length, Date.now() - t0,'ms')
							// debugFolder.file(pid1 + '.json').json = con
							if (!con) console.log("ALARM", pid1)
							if (con?.includes(pid2)) stat.contacts++
							// console.log(pid1, pid2,con )
						}
						// let key = Object.entries(VARS)//.filter((key, val) => val.length > 1)
						// console.log("KEY",key)
						let key
						if (KEY == 'maxTimespanBetweenSequences') key = maxTimespanBetweenSequences
						if (KEY == 'maxTimespanBetweensContacts') key = maxTimespanBetweensContacts
						if (KEY == 'locationLayer') key = locationLayer
						if (KEY == 'maxContactDepth') key = maxContactDepth
						// console.log("KEY", key)
						// console.log(stat)
						output.ABS.TOTAL ??= {}
						output.ABS.TOTAL[dist] = stat.pairs
						output.ABS[key] ??= {}
						output.ABS[key][dist] = stat.contacts
						output.REL[key] ??= {}
						output.REL[key][dist] = (stat.contacts * 100 / stat.pairs).toFixed(1)
						// output.abs[key ][dist+ "tot"] = stat.pairs

					}
				}
			}
		}
	}
	// console.log("CALC",output)
	return output
}



export function seqDateFilter(data, days) {
	data = JSON.parse(JSON.stringify(data))
	for (let pid1 in data.seq) {
		let d1 = Date.parse(data.meta[pid1].typingDate)
		// console.log(d1)
		for (let pid2 in data.seq[pid1]) {
			let d2 = Date.parse(data.meta[pid2].typingDate)
			let dd = Math.abs(d1 - d2)
			let ddd = dd / 1000 / 60 / 60 / 24
			if (ddd > days) data.seq[pid1][pid2] = undefined
			// console.log(pid1, pid2, data.seq[pid1][pid2], data.meta[pid1].typingDate, ddd)
		}
	}
	return data
}

import * as type from "../1.dist.gen/lib.js"
import { unique } from "../deps.js"

export function contactFilter(data, location = 'any', maxTimespanBetweensContacts = 0) {
	// let DAY = 24 * 60 * 60
	let out = {}
	for (let locType in data) {
		if (location != 'any' && location != locType) continue
		for (let pid1 in data[locType]) {
			for (let pid2 in data[locType][pid1]) {
				let dur = data[locType][pid1][pid2]
				if (!dur) continue
				if (dur * 1 < -maxTimespanBetweensContacts) continue
				// console.log(locType, pid1, pid2, dur*1, '::', duration)
				out[pid1] ??= []
				out[pid1].push(pid2)
				out[pid1] = unique(out[pid1]).sort()
				out[pid1].sort()
			}
		}
	}
	// out = unique(out).sort()
	// console.log('con',out)
	return out
}

// export function addContactDegree(data) { // takes to long, find another approach
// 	let out = {}
// 	for (let pid1 in data) {
// 		out[pid1] = data[pid1]
// 		for (let pid2 of data[pid1]) {
// 			out[pid1] = [...out[pid1], ...data[pid2]]
// 		}
// 	}
// 	return out
// }

export function contactsForPID(data, PID, degree = 0) {
	// console.log('contactsForPID', Object.keys(data).length, PID)
	// console.log('contacts',data)
	let out = data[PID] ?? []
	// console.log("\ncontactsForPID start", degree, out.length)
	for (let i = 0; i < degree; i++) {
		for (let pid2 of out ?? []) {
			out = [...out, ...data[pid2]]
		}
		// console.log("contactsForPID", i, out.length)
	}
	// console.log("contactsForPID final", degree, out.length, '//', unique(out).sort().length)
	// return out
	return unique(out).sort()
}


export function cgmlstPairs(data) {
	let out = {}
	for (let pid1 in data) {
		// out[pid1] = {}
		for (let pid2 in data[pid1]) {
			if (pid1 >= pid2) continue
			let val = data[pid1][pid2]
			if (!val) continue
			out[val] ??= []
			out[val].push([pid1, pid2])
		}
	}
	return out
}


// export function cgmlstFilter(data, distance = 0) {
//     let out = {}
//     for (let pid1 in data) {
//         for (let pid2 in data[pid1]) {
//             // console.log("test",data[pid1][pid2],'--',distance)
//             if (data[pid1][pid2] != distance) continue
//             // console.log(pid1,pid2,distance)
//             out[pid1] ??= []
//             out[pid1].push(pid2)
//         }
//     }
//     return out
// }



// export function cgmlstPreparation(data) {
//     let out = {}
//     for (let pid1 in data) {
//         out[pid1] = {}
//         for (let pid2 in data[pid1]) {
//             out[pid1][pid2] = data[pid1][pid2]?.split('|')?.map(x => x * 1)?.sort((a, b) => a - b)?.[0]
//         }
//     }
//     return out
// }



