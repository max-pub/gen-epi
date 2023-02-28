import settings from '../settings.js'
import { TALI, intersection } from '../deps.js'
// import * as tree from './lib/tree.js'
// import * as filter from './filter.js'
import * as type from './lib.js'

for (let germ of settings.folder.base.list) {
	// if (germ.name != 'pseu.aeru') continue
	// if (germ.name != 'esch.coli') continue
	// if (germ.name != 'sta.au') continue
	// if (germ.name != 'test.germ') continue
	if(germ.name.startsWith('.')) continue
	console.log('germ', germ.name)
	let distFolder = settings.folder.dist.folder(germ.name).make
	let debugFolder = distFolder.folder('debug').make

	let data = TALI.grid.parse(germ.file('cgmlst.tsv').text)
	data.meta = TALI.grid.parse(germ.file('meta.tsv').text).meta
	// let metaTree = tree.makeMetaTree(data.meta)
	// pairFolder.file('meta.tree.json').json = metaTree

	for (let typ of ['cgmlst']) { // 'mlst',
		let seq = type.calculateDistanceMatrix(data[typ], germ.name)
		let pat = type.groupDistanceMatrixByPatientID(seq, data.meta)
		let lt20 = type.filter(pat, 20)
		distFolder.file('gen.tsv').text = TALI.grid.stringify({ lt20}, { sortRows: true, sortCols: true })
		debugFolder.file('gen.tsv').text = TALI.grid.stringify({ pat, seq }, { sortRows: true, sortCols: true })
	}

}




