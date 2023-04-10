import settings from '../settings.js'
import { TALI } from '../deps.js'
// import * as tree from './lib/tree.js'
import * as epi from './lib.js'

// console.log('germs', settings.germs.map(x => x.name))
// let germs = Deno.args ?? settings.folder.base.list
for (let germ of settings.items('base')) {
	// if(germ.name!='pseu.aeru') continue
	// if (germ.name != 'esch.coli') continue
	// if (germ.name != 'sta.au') continue
	// if(germ.name != 'test.germ') continue
	// if(germ.name.startsWith('.')) continue
	console.log('germ', germ.name)
	let data = TALI.grid.parse(germ.file('epi.tsv').text)
	let epiTree = epi.makeEpiTree(data.epi)
	// console.log(epiTree)
	// continue
	let distFolder = settings.folder.dist.folder(germ.name).make
	let debugFolder = distFolder.folder('debug').make
	debugFolder.file('epi.tree.json').json = epiTree
	let epiDist = epi.crossMatch(epiTree, germ.name)
	debugFolder.file('epi.json').json = epiDist

	let epiDi = epi.regroup(epiDist)
	distFolder.file('epi.tsv').text = TALI.grid.stringify(epiDi, { sortRows: true, sortCols: true })
}




