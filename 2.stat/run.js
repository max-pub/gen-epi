import settings from '../settings.js'
import { TALI } from '../deps.js'
import * as lib from './lib.js'

let debugFolder = settings.folder.stat.folder('DEBUG').make
// let cgmlstDistances = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,]// 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
// let GERMS = ['esch.coli', 'sta.au', 'enco.faec']
// for (let germ of settings.folder.dist.list.reverse()) {
for (let germ of settings.items('dist')) {
	// for (let germName of GERMS) {
	// let germ = settings.folder.dist.folder(germName)
	// if (germ.name != "sta.au") continue
	// if (germ.name != "esch.coli") continue
	// if (germ.name != "enco.faec") continue
	// if (germ.name != 'test.germ') continue
	if (germ.name.startsWith('.')) continue
	console.log('germ', germ.name)
	// continue
	let statFolder = settings.folder.stat.folder('gen.epi').folder(germ.name).make


	let cgmlstDist = TALI.grid.parse(germ.file(`gen.tsv`).text).lt20
	// console.log(cgmlstDist)
	let cgmlstPairs = lib.cgmlstPairs(cgmlstDist)
	// console.log(cgmlstPairs)

	let epiDist = TALI.grid.parse(germ.file('epi.tsv').text)



	
	calc({ // alle parameter fest
		locationLayers: ['any'],
		delayDays: [0],
		contactDegrees: [0],
		key: 'location',
		file: statFolder.file(`A-0-0.tsv`),
		cgmlstPairs,
		epiDist,
	})

	calc({ // alle parameter fest
		locationLayers: ['any'],
		delayDays: [7],
		contactDegrees: [1],
		key: 'location',
		file: statFolder.file(`A-7-1.tsv`),
		cgmlstPairs,
		epiDist,
	})



	
	calc({ // location variabel
		locationLayers: ['room', 'ward', 'clinic', 'any'],
		delayDays: [0],
		contactDegrees: [0],
		key: 'location',
		file: statFolder.file(`X-0-0.tsv`),
		cgmlstPairs,
		epiDist,
	})

	calc({// delay variabel
		locationLayers: [ 'any'],
		delayDays: [0,7,14,21,28],
		contactDegrees: [0],
		key: 'days',
		file: statFolder.file(`A-X-0.tsv`),
		cgmlstPairs,
		epiDist,
	})

	calc({// kontakt-tiefe variabel
		locationLayers: [ 'any'],
		delayDays: [0],
		contactDegrees: [0,1,2,3],
		key: 'degree',
		file: statFolder.file(`A-0-X.tsv`),
		cgmlstPairs,
		epiDist,
	})


}

function calc(o) {
	let output = lib.calc(o.cgmlstPairs, o.epiDist, o, o.key)
	o.file.text = TALI.grid.stringify(output)
}















	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['any'], delayDays: [7], contactDegrees: [1] }, 'degree')
	// statFolder.file(`A-7-1.tsv`).text = TALI.grid.stringify(output)



	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['room', 'ward', 'clinic', 'any'] }, 'location')
	// statFolder.file(`X-0-0.tsv`).text = TALI.grid.stringify(output)

	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['room', 'ward', 'clinic', 'any'], contactDegrees: [1], delayDays: [7] }, 'location')
	// statFolder.file(`X-7-1.tsv`).text = TALI.grid.stringify(output)



	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['any'], delayDays: [0, 7, 14] }, 'delay',)
	// statFolder.file(`A-X-0.tsv`).text = TALI.grid.stringify(output)

	// output = lib.calc(cgmlstPairs, epiDist, { delayDays: [0, 7, 14, 21, 28] }, 'delay',)
	// statFolder.file(`R-X-0.tsv`).text = TALI.grid.stringify(output)



	// output = lib.calc(cgmlstPairs, epiDist, { contactDegrees: [0, 1, 2, 3] }, 'degree',)
	// statFolder.file(`R-0-X.tsv`).text = TALI.grid.stringify(output)

	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['ward'], contactDegrees: [0, 1, 2, 3] }, 'degree')
	// statFolder.file(`W-0-X.tsv`).text = TALI.grid.stringify(output)

	// output = lib.calc(cgmlstPairs, epiDist, { locationLayers: ['any'], contactDegrees: [0, 1, 2] }, 'degree')
	// statFolder.file(`A-0-X.tsv`).text = TALI.grid.stringify(output)



	// console.log(epiDist)
	// continue
	// let contacts = contactFilter(epiDist, 'any', 0)
	// console.log(contactsForPID(contacts,"60001000",0).length)
	// console.log(contactsForPID(contacts,"60001000",1).length)
	// console.log(contactsForPID(contacts,"60001000",2).length)
	// console.log(contactsForPID(contacts,"60001000",3).length)
	// continue
	// let output
	// output = calc(cgmlstContactsCache, epiDist, { locationLayers: ['room'], contactDegrees: [0, 1, 2, 3] }, '')
	// statFolder.file(`room___days.0.tsv`).text = TALI.grid.stringify(output)

	// output = calc(cgmlstContactsCache, epiDist, { locationLayers: ['any'], delayDays: [7], contactDegrees: [0] }, 'degree')
	// statFolder.file(`A-7-0.tsv`).text = TALI.grid.stringify(output)
	// continue
