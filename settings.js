import { FS } from './deps.js'
let data = FS.folder('_data', import.meta.url).make
console.log('data folder', data.path)


export default {
	folder: {
		data,
		raw: data.folder('raw').make,
		norm: data.folder('norm').make,
		base: data.folder('base').make,
		dist: data.folder('dist').make,
		stat: data.folder('stat').make,
	},
	from: '2015-01-01',
	// till: '2021-12-31',
	till: '2022-01-01',
	app: {
		maxTimegapInDays: 30,
	},
	// germs: germArgs.length ? germArgs : germFolder

	items: base => {
		let germArgs = Deno.args.map(x => data.folder(base).folder(x))
		let germFolder = data.folder(base).list.filter(x => !x.name.startsWith('.'))
		return germArgs.length ? germArgs : germFolder
	}
}


// export function items(base){
// 	let germArgs = Deno.args.map(x => data.folder(base).folder(x))
// 	let germFolder = data.folder(base).list.filter(x => !x.name.startsWith('.'))
// 	return germArgs.length ? germArgs : germFolder
// }
