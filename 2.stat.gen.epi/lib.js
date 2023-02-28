
export function calc(cgmlstPairs, epiDist, VARS = {}, KEY = 'delay') {
	const DEFAULT_VARS = { delayDays: [0], locationLayers: ['room'], contactDegrees: [0] }
	VARS = { ...DEFAULT_VARS, ...VARS }
	// console.log('cg',cgmlstDist)
	// console.log(germ.name,"dist",JSON.stringify(distances).length)
	// console.log(distances)
	let output = { REL: {}, ABS: {} }
	for (let day of VARS.delayDays) {
		for (let loc of VARS.locationLayers) {
			let epiContacts = contactFilter(epiDist, loc, -day)
			// console.log('epicon',epiContacts)
			for (let deg of VARS.contactDegrees) {
				for (let dist in cgmlstPairs) {
					// let cgmlstContacts = cgmlstFilter(cgmlstDist, dist)
					let cgmlstContacts = cgmlstPairs[dist]
					// console.log(germ.name, dist, "dist", Object.keys(distances).length)
					// if(deg>0) contacts = addContactDegree(contacts)
					console.log(KEY.toUpperCase(), `cgMLST:${dist} | days:${day} | loc:${loc} | deg: ${deg}`, '---', JSON.stringify(VARS))
					let stat = { pairs: cgmlstContacts.length, contacts: 0 }
					for (let [pid1, pid2] of cgmlstContacts) {
						let con = contactsForPID(epiContacts, pid1, deg)
						// console.log(pid1, pid2, 'contacts', con.length)
						// debugFolder.file(pid1 + '.json').json = con
						if (!con) console.log("ALARM", pid1)
						if (con?.includes(pid2)) stat.contacts++
						// console.log(pid1, pid2,con )
					}
					// let key = Object.entries(VARS)//.filter((key, val) => val.length > 1)
					// console.log("KEY",key)
					let key
					if (KEY == 'delay') key = day
					if (KEY == 'location') key = loc
					if (KEY == 'degree') key = deg
					// console.log("KEY", key)
					// console.log(stat)
					output.REL[key] ??= {}
					output.REL[key][dist] = (stat.contacts * 100 / stat.pairs).toFixed(1)
					output.ABS.TOTAL ??= {}
					output.ABS[key] ??= {}
					output.ABS[key][dist] = stat.contacts
					// output.abs[key ][dist+ "tot"] = stat.pairs
					output.ABS.TOTAL[dist] = stat.pairs

				}
			}
		}
	}
	// console.log("CALC",output)
	return output
}




import { unique } from "../deps.js"

export function contactFilter(data, location = 'any', duration = 0) {
	// let DAY = 24 * 60 * 60
	let out = {}
	for (let locType in data) {
		if (location != 'any' && location != locType) continue
		for (let pid1 in data[locType]) {
			for (let pid2 in data[locType][pid1]) {
				let dur = data[locType][pid1][pid2]
				if (!dur) continue
				if (dur * 1 < duration) continue
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
