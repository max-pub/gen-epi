// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Log {
    static ERROR = 1;
    static WARNING = 2;
    static INFO = 3;
    static DEBUG = 4;
    static level = Log.DEBUG;
    static callback = null;
    constructor(p = ''){
        this.prefix = p;
    }
    text(type, ...p) {
        if (Log.level < Log[type]) return;
        let func = getStackTrace().filter((x)=>!x.startsWith('file:'))[0];
        if (func == 'Log.measure') func = p.pop().name;
        func = func?.replace('Module.', '')?.replace('Object.', '')?.replace('[as function]', '')?.trim();
        let dur = Date.now() - p.slice(-1)[0];
        if (dur < 1_000_000) p = p.slice(0, -1);
        let v = standardLog(this.prefix, func, dur, ...p);
        Log.callback?.(v.filter((x)=>!x?.startsWith?.('#')).join(' '));
    }
    debug(...p) {
        this.text('DEBUG', '#999', ...p);
    }
    info(...p) {
        this.text('INFO', '#fff', ...p);
    }
    warning(...p) {
        this.text('WARNING', '#fa0', '⚠', ...p);
    }
    error(...p) {
        this.text('ERROR', '#f00', '✖', ...p);
    }
    measure(f, ...p) {
        let t0 = Date.now();
        let q = p.map((x)=>JSON.stringify(x)?.slice(0, 20)).join(', ');
        this.info(q, '#aaa', '(START)', f);
        let res = f?.(...p);
        this.info(q, '#aaa', '(DONE)', t0, f);
        return res;
    }
}
const wrap = (a1, x, b)=>x ? a1 + x + b : '';
function standardLog(prefix, caller, duration, ...p) {
    let time = new Date().toISOString().slice(11, 19);
    return colorLog('#999', time, '#bbb', wrap('[', prefix, ']'), '#999', wrap('{', caller, '}'), ...p, '#999', wrap('(in ', duration, 'ms)'));
}
function colorLog(...p) {
    let text = p.map((x)=>x?.startsWith?.('#') ? '%c' : x).join(' ').replaceAll('%c ', '%c');
    let color = p.filter((x)=>x?.startsWith?.('#')).map((x)=>`color:${x}`);
    console.log(text, ...color);
    return p;
}
function getStackTrace() {
    try {
        a.b = 1;
    } catch (e) {
        var st = e.stack;
    }
    st = st.split('\n').map((x)=>x.slice(7).split('(')[0].trim()).slice(4);
    return st;
}
function cwd() {
    return Deno.cwd() + '/';
}
function load(p) {
    return Deno.readFileSync(p);
}
function save(p, bytes, o) {
    return Deno.writeFileSync(p, bytes, o);
}
function list(p) {
    return Array.from(Deno.readDirSync(p)).map((x)=>x.isDirectory ? x.name + '/' : x.name);
}
function mkdir(p, o = {}) {
    Deno.mkdirSync(p, o);
}
function move(p, q) {
    Deno.renameSync(p, q);
}
function info(p) {
    return Deno.statSync(p);
}
function kill(p) {
    return Deno.removeSync(p);
}
const mod = {
    cwd: cwd,
    load: load,
    save: save,
    list: list,
    mkdir: mkdir,
    move: move,
    info: info,
    kill: kill
};
function urlFrom(url, base, cwd) {
    if (base instanceof URL) base = base.href;
    if (cwd && !(base?.startsWith?.('/') || base?.includes('://'))) base = cwd;
    if (!base && !url?.includes?.('://')) url = 'file://' + url;
    if (base && !base?.includes?.('://')) base = 'file://' + base;
    return new URL(cleanHREF(new URL(url, base).href));
}
function cleanHREF(href) {
    return 'file://' + href.replace('file://', '').replaceAll('//', '/');
}
function bytes_to_string(bytes, encoding = 'utf8') {
    return new TextDecoder(encoding).decode(bytes);
}
function string_to_bytes(string, encoding = 'utf8') {
    return new TextEncoder(encoding).encode(string);
}
class Base {
    static binding;
    static cwd;
    type;
    url;
    static log = {
        warning: function() {},
        error: function() {}
    };
    constructor(url = '', base){
        this.url = urlFrom(url, base, Base.cwd);
    }
    static bind(x) {
        Base.binding = x;
        Base.cwd = x.cwd();
    }
    get href() {
        return this.url.href;
    }
    get path() {
        return this.url.pathname;
    }
    get info() {
        try {
            return Base.binding.info(this.url);
        } catch  {
            return;
        }
    }
    get exists() {
        return this.info ? true : false;
    }
    toString() {
        return this.href;
    }
    get name() {
        return this.href?.split('/')?.filter((x)=>x.trim())?.slice(-1)?.[0] ?? null;
    }
    get basename() {
        return this.name?.split('.')?.slice(0, -1)?.join('.') ?? null;
    }
    get extension() {
        return this.name?.split('.')?.slice(-1)?.[0] ?? null;
    }
}
function lines(string = "") {
    return string?.split('\r\n')?.flatMap((x)=>x.split('\r'))?.flatMap((x)=>x.split('\n')) ?? [];
}
const file = (path, base)=>new File(path, base);
const folder = (path, base)=>new Folder(path + '/', base);
class File extends Base {
    type = 'file';
    get parent() {
        return folder('./', this.url.href);
    }
    get load() {
        return new Load(this);
    }
    get append() {
        this._append = true;
        return this;
    }
    get bytes() {
        try {
            return Base.binding.load(this.url);
        } catch (e) {
            Base.log.warning('couldnt read file', this.href);
        }
    }
    set bytes(p) {
        if (this._append && !this.exists) Base.binding.save(this.url, p);
        else Base.binding.save(this.url, p, {
            append: this._append
        });
        this._append = false;
    }
    get text() {
        return bytes_to_string(this.bytes);
    }
    set text(p) {
        this.bytes = string_to_bytes(p);
    }
    get json() {
        try {
            return JSON.parse(this.text);
        } catch (e) {
            Base.log.warning('json decoding error', this.href);
            return null;
        }
    }
    set json(p) {
        this.text = JSON.stringify(p, null, '\t');
    }
    get lines() {
        return lines(this.text);
    }
    set lines(p) {
        this.text = p.join('\n') + '\n';
    }
    get tsv() {
        return this.lines.map((x)=>x.split('\t'));
    }
    get ndjson() {
        return this.lines.filter((x)=>x).map((x)=>{
            try {
                return JSON.parse(x);
            } catch  {
                return null;
            }
        });
    }
    set ndjson(p) {
        this.lines = p.map((x)=>JSON.stringify(x));
    }
    get size() {
        return this.info?.size ?? null;
    }
    get kill() {
        Base.binding.kill(this.url);
        return this;
    }
    moveTo(destination) {
        if (destination instanceof File) destination = destination.href;
        if (destination instanceof Folder) destination = destination.href + this.name;
        if (typeof destination == 'string') destination = new URL(destination);
        console.log("MOVE", this.href, 'to', destination.href);
        try {
            Base.binding.move(this.url, destination);
        } catch (e) {
            console.log('couldnt move from', this.href, 'to', destination.href);
        }
    }
}
class Folder extends Base {
    type = 'folder';
    folder(path = '') {
        return folder(path + '/', this.url.href);
    }
    file(path = '') {
        return file(path, this.url.href);
    }
    get parent() {
        return folder(this.url.href + '../');
    }
    deepList() {
        return this.flatList().map((x)=>x.type == 'file' ? x : [
                x,
                x.deepList()
            ]).flat(5);
    }
    flatList() {
        try {
            return Base.binding.list(this.url).map((item)=>item.endsWith('/') ? new Folder(item, this.url) : new File(item, this.url));
        } catch (e) {
            return [];
        }
    }
    get deep() {
        this._deep = true;
        return this;
    }
    get list() {
        if (this._deep) {
            this._deep = false;
            return this.deepList();
        } else {
            return this.flatList();
        }
    }
    load({ mode ='text' , depth =1  } = {}) {
        try {
            return Object.fromEntries(Base.binding.list(this.url).map((item)=>[
                    item,
                    item.endsWith('/') ? null : file(item, this.url)[mode]
                ]));
        } catch (e) {
            return {};
        }
    }
    get make() {
        try {
            Base.binding.mkdir(this.url, {
                recursive: true
            });
        } catch  {}
        return this;
    }
    get kill() {
        Base.binding.kill(this.url);
        return this;
    }
}
Base.bind(mod);
const mod1 = {
    Base,
    File,
    Folder,
    file,
    folder
};
const __default = {
    separator: {
        table: '\n\n\n',
        row: '\n',
        cell: '\t',
        list: '|'
    },
    tab: ':T:',
    line: ':L:',
    none: '',
    remove: [
        '',
        'null',
        'undefined',
        'NaN'
    ]
};
function trim(string, characters = ' ') {
    let c = '\\' + characters.split('').join('\\');
    return string.replace(new RegExp(`^[${c}]+|[${c}]+$`, 'g'), '');
}
function blocks(string = "") {
    return string?.split('\r\n\r\n')?.flatMap((x)=>x.split('\r\r'))?.flatMap((x)=>x.split('\n\n')) ?? [];
}
function lines1(string = "") {
    return string?.split('\r\n')?.flatMap((x)=>x.split('\r'))?.flatMap((x)=>x.split('\n')) ?? [];
}
function flipAA(aa) {
    let out = [];
    for(let i in aa){
        for(let j in aa[i]){
            out[j] ??= [];
            out[j][i] = aa[i][j];
        }
    }
    return out;
}
function prettifyAA(aa, options = {}) {
    let maxColumnLengths = flipAA(aa.map((row)=>row.map((col)=>String(col ?? '').length))).map((col)=>Math.max(...col));
    if (options.pretty == 2) maxColumnLengths = maxColumnLengths.map((x)=>Math.ceil(x / 4) * 4);
    return aa.map((row)=>row.map((col, j)=>pad(col, maxColumnLengths[j])));
}
function pad(str, len) {
    return String(str ?? '')?.padEnd?.(len, ' ') ?? '';
}
function str2aaa(string, options = {}) {
    let aaa = blocks(string).map((table)=>lines1(table).filter((row)=>row.trim()).map((row)=>row.split('\t')));
    return decodeAAA(aaa, options);
}
function aaa2str(aaa, options = {}) {
    if (options.pretty) aaa = aaa.map((aa)=>prettifyAA(aa));
    aaa = encodeAAA(aaa, options);
    return aaa.map((table)=>table.map((row)=>row.join(__default.separator.cell)).join(__default.separator.row)).join(__default.separator.table);
}
function encodeAAA(aaa, options = {}) {
    let none = options.none ?? __default.none;
    let remove = [
        ...options.remove ?? [],
        ...__default.remove ?? []
    ];
    return aaa.map((table)=>table.map((row)=>row.map((cell)=>remove?.includes(cell) ? undefined : cell).map((cell)=>cell === undefined ? none : cell).map((cell)=>String(cell).replaceAll('\t', __default.tab).replaceAll('\n', __default.line).trim())));
}
function decodeAAA(aaa, options = {}) {
    let none = options.none ?? __default.none;
    let remove = [
        ...options.remove ?? [],
        ...__default.remove ?? []
    ];
    return aaa.map((table)=>table.map((row)=>row.map((cell)=>cell == none ? undefined : cell).map((cell)=>remove.includes(cell) ? undefined : cell)));
}
function str2aaa1(string, options = {}) {
    return [
        lines1(string).map((row)=>row.split(options.delimiter ?? ';').map((cell)=>trim(cell, options.quotes ?? '"')))
    ];
}
function aa2ad(aa) {
    let cols = aa[0];
    let ad = aa.slice(1).map((line)=>Object.fromEntries(line.map((x, i)=>[
                cols[i],
                x
            ])));
    return ad;
}
function parse(string, options = {}) {
    let aa = str2aaa1(string, options)[0];
    let ad = aa2ad(aa);
    return ad;
}
const mod2 = {
    str2aaa: str2aaa1,
    aa2ad: aa2ad,
    parse: parse
};
function str2aaa2(text, options) {
    let tables = [];
    const doc = new DOMParser().parseFromString(text, 'text/html');
    for (let table of doc.querySelectorAll('table')){
        let aa = parseTable(table, options);
        tables.push(aa);
    }
    return tables;
}
function closest(node, search) {
    if (!node.parentNode) return null;
    if (search.split(',').includes(node.nodeName.toLowerCase())) return node;
    return closest(node.parentNode, search);
}
function parseTable(table, options) {
    let head = [];
    let body = [];
    let foot = [];
    let rowspans = {};
    let row;
    for (let tr of table.querySelectorAll('tr')){
        [row, rowspans] = parseRow(tr, rowspans, options);
        if (closest(tr, 'thead')) head.push(row);
        else if (closest(tr, 'tfoot')) foot.push(row);
        else body.push(row);
    }
    return [
        ...head,
        ...body,
        ...foot
    ];
}
function parseRow(tr, rowspans = {}, options) {
    let row = [];
    let i = -1;
    for (let td of tr.querySelectorAll('th,td')){
        i++;
        if (rowspans[i]) {
            row.push('|=|');
            rowspans[i]--;
        }
        const val = parseColumn(td, options);
        row.push(val);
        const colspan = td.getAttribute('colspan') * 1;
        for(let i1 = 0; i1 < colspan - 1; i1++)row.push('-=-');
        const rowspan = td.getAttribute('rowspan') * 1;
        if (rowspan) rowspans[i] = rowspan - 1;
    }
    return [
        row,
        rowspans
    ];
}
function parseColumn(td, options) {
    let val = [
        ...td.childNodes
    ].filter((x)=>x.nodeType == 3).map((x)=>x.textContent).join('').trim();
    if (!val) val = td.innerText;
    let nsVal = val.replaceAll(/\s/g, '');
    if (options.region?.toLowerCase() == 'de') nsVal = nsVal.replaceAll('.', '').replace(',', '.');
    let intVal = nsVal * 1;
    if (!isNaN(intVal)) return intVal;
    return val;
}
const isArrayUnique = (a1)=>new Set(a1).size == a1.length;
const isRowUnique = (aa, n)=>isArrayUnique(aa[n]);
const isColumnUnique = (aa, n)=>isArrayUnique(aa.map((x)=>x[n]));
const addUniqueRow = (aa)=>aa.unshift(Array(aa[0].length).fill(1).map((x, i)=>'r' + (i * 1 + 1)));
const addUniqueColumn = (aa)=>aa.map((row, i)=>row.unshift('c' + (i * 1 + 1)));
function uniqueAA(aa) {
    const row = isRowUnique(aa, 0);
    const col = isColumnUnique(aa, 0);
    if (!row) addUniqueRow(aa);
    if (!col) addUniqueColumn(aa);
    if (!row && !col) aa[0].shift();
}
function aaa2ddd(aaa, options = {}) {
    let tables = {};
    for(let i in aaa){
        let tableName = aaa[i][0][0] || 't' + (i * 1 + 1);
        tables[tableName] = aa2dd(aaa[i], options);
    }
    return tables;
}
function aa2dd(aa, options = {}) {
    uniqueAA(aa);
    let cols = aa[0];
    let dd = {};
    for (let row of aa.slice(1)){
        dd[row[0]] = Object.fromEntries(row.map((x, i)=>[
                cols[i],
                x
            ]).slice(1));
    }
    return dd;
}
function ddd2aaa(ddd, options = {}) {
    let aaa = [];
    for(let tableName in ddd){
        let aa = dd2aa(ddd[tableName], options);
        aa[0][0] = tableName;
        aaa.push(aa);
    }
    return aaa;
}
function dd2aa(dd, options = {}) {
    let aa = [];
    let cols = [
        ...new Set(Object.keys(dd).flatMap((row)=>Object.keys(dd[row])))
    ];
    if (options.sortCols) cols = cols.sort();
    if (Array.isArray(options.sortCols)) cols = options.sortCols;
    for(let row in dd){
        aa.push([
            row,
            ...cols.map((col)=>dd[row][col])
        ]);
    }
    let sortCol = -1;
    if (options.sortRows) sortCol = 0;
    if (options.sortCol && cols.indexOf(options.sortCol) != -1) sortCol = cols.indexOf(options.sortCol) + 1;
    if (sortCol != -1) {
        aa = aa.sort((a1, b)=>a1[sortCol] > b[sortCol] ? 1 : a1[sortCol] < b[sortCol] ? -1 : 0);
    }
    aa.unshift([
        '',
        ...cols
    ]);
    if (options.flip) aa = flipAA(aa);
    return aa;
}
function str2aaa3(str, src, opt) {
    switch(src?.toLowerCase?.()){
        case 'csv':
            return str2aaa1(str, opt);
        case 'html':
            return str2aaa2(str, opt);
        default:
            return str2aaa(str, opt);
    }
}
function parse1(str, options = {}) {
    let aaa = str2aaa3(str, options.source, options);
    if (options.target?.toLowerCase?.() == 'aaa') return aaa;
    let ddd = aaa2ddd(aaa, options);
    return ddd;
}
function aaa2str1(aaa, tgt, opt) {
    switch(tgt?.toLowerCase?.()){
        default:
            return aaa2str(aaa, opt);
    }
}
function stringify(ddd, options = {}) {
    let aaa = ddd2aaa(ddd, options);
    let str = aaa2str1(aaa, options.target, options);
    return str;
}
const mod3 = {
    parse: parse1,
    stringify: stringify
};
function parse2(s) {
    let tsv = lines1(s).map((line)=>line.split('\t'));
    return Object.fromEntries(tsv.map((line)=>[
            line[0],
            line[1]
        ]));
}
function stringify1(o) {
    return Object.entries(o).map((x)=>x.join('\t')).join('\n');
}
const mod4 = {
    parse: parse2,
    stringify: stringify1
};
const TALI = {
    grid: mod3,
    tree: mod4,
    settings: __default
};
function date(string) {
    return new Date(Date.parse(string ?? new Date()));
}
function p0(s) {
    return String(s).padStart(2, '0');
}
function Y(d) {
    return date(d).getFullYear();
}
function M(d) {
    return p0(date(d).getMonth() + 1);
}
function D(d) {
    return p0(date(d).getDate());
}
function isoDate(date) {
    return Y(date) + '-' + M(date) + '-' + D(date);
}
function h(d) {
    return p0(date(d).getHours());
}
function m(d) {
    return p0(date(d).getMinutes());
}
function s(d) {
    return p0(date(d).getSeconds());
}
function isoTime(date) {
    return h(date) + ':' + m(date) + ':' + s(date);
}
function isoDateTime(date) {
    return isoDate(date) + 'T' + isoTime(date);
}
function format(d, format, locale = 'lookup') {
    d = date(d);
    var str = (c)=>d.toLocaleString(locale, c);
    var n = 'numeric';
    var _2 = '2-digit';
    var f = {
        DDDD: str({
            weekday: 'long'
        }),
        DDD: str({
            weekday: 'short'
        }),
        DD: str({
            day: _2
        }),
        '!D': str({
            day: n
        }),
        MMMM: str({
            month: 'long'
        }),
        MMM: str({
            month: 'short'
        }),
        MM: str({
            month: _2
        }),
        '!M': str({
            month: n
        }),
        YYYY: str({
            year: n
        }),
        YY: str({
            year: _2
        }),
        hh: str({
            hour: _2,
            hour12: false
        }),
        '!h': str({
            hour: n,
            hour12: false
        }),
        mm: str({
            minute: _2
        }),
        '!m': str({
            minute: n
        }),
        ss: str({
            second: _2
        }),
        '!s': str({
            second: n
        })
    };
    if (f.mm < 10) f.mm = '0' + f.mm;
    if (f.ss < 10) f.ss = '0' + f.ss;
    for(var typ in f){
        var format = format.replace(typ, f[typ]);
    }
    return format;
}
function humanDuration(d) {
    if (Math.abs(d) > 86400) return Math.round(d / 86400) + ' d';
    if (Math.abs(d) > 3600) return Math.round(d / 3600) + ' h';
    if (Math.abs(d) > 60) return Math.round(d / 60) + ' m';
    return d + ' s';
}
function parseGermanDate(s) {
    if (s?.length != 10) return null;
    let parts = s?.split('.');
    if (parts.length != 3) return null;
    let [dd, mm, yy] = parts;
    return `${yy}-${mm}-${dd}`;
}
function parseDate(s) {
    if (!s) return null;
    return parseGermanDate(s) ?? isoDate(s);
}
function unique(array, property) {
    if (property) return Object.values(Object.fromEntries(array.map((x)=>[
            x[property],
            x
        ])));
    else return [
        ...new Set(array)
    ];
}
function cluster(lists) {
    Date.now();
    lists.length;
    let out = [];
    while(lists.length > 0){
        let [first, ...rest] = lists;
        first = new Set(first);
        let lf = -1;
        while(first.size > lf){
            lf = first.size;
            let rest2 = [];
            for (let r of rest){
                if (intersection([
                    ...first
                ], r).length > 0) first = new Set([
                    ...first,
                    ...r
                ]);
                else rest2 = [
                    ...rest2,
                    r
                ];
            }
            rest = rest2;
        }
        out.push([
            ...first
        ]);
        lists = rest;
    }
    return out;
}
function intersection(...arrays) {
    let output = arrays[0] ?? [];
    for (let a1 of arrays?.slice(1) ?? [])output = output.filter((value)=>a1.includes(value));
    return output;
}
function difference(a1, b) {
    a1 = new Set(a1);
    b = new Set(b);
    let difference = new Set([
        ...a1
    ].filter((x)=>!b.has(x)));
    return [
        ...difference
    ];
}
const compare = (a1, b)=>a1 > b ? 1 : a1 < b ? -1 : 0;
const sortBy = (a1, prop)=>a1.sort((a1, b)=>compare(prop(a1), prop(b)));
const sum = (x)=>x.reduce((a1, b)=>a1 + b, 0);
const average = (x)=>sum(x) / x.length || 0;
const median = (x)=>{
    let l2 = x.length / 2;
    return x.length % 2 == 0 ? (x[l2 - 1] + x[l2]) / 2 : x[Math.floor(l2)];
};
function select(object, ...keys) {
    return Object.fromEntries(Object.entries(object).filter(([key])=>keys.includes(key)));
}
function kill1(object, ...keys) {
    return Object.fromEntries(Object.entries(object).filter(([key])=>!keys.includes(key)));
}
const filter = (o, f)=>Object.fromEntries(Object.entries(o).filter(([k, v])=>f(k, v)));
const map = (o, f)=>Object.fromEntries(Object.entries(o).map(([k, v])=>f(k, v)));
const mapValues = (o, f)=>map(o, (k, v)=>[
            k,
            f(v)
        ]);
const compare1 = (a1, b)=>a1 > b ? 1 : a1 < b ? -1 : 0;
const sortByKey = (o)=>Object.fromEntries(Object.entries(o).sort((a1, b)=>compare1(a1[0], b[0])));
const SYMBOL = {
    script: '!',
    parameters: '!!',
    injection: /\!(css|js|json|)\>(.*)/
};
const TYPES = {
    json: 'script',
    js: 'script',
    mjs: 'script',
    css: 'style'
};
function template(template, p = {}) {
    let l = lines1(template);
    let h = header(l);
    let b = body(l, p.injections).join('\n');
    b = `let ${h} = arguments${h.startsWith('{') ? '[0]' : ''}\n` + b;
    try {
        return new Function(b);
    } catch  {
        console.error("ERROR:", b);
    }
    return Function();
}
function header(lines) {
    let p = [
        'x'
    ];
    let firstLine = lines.filter((x)=>x.trim().startsWith(SYMBOL.parameters))[0]?.trim();
    if (firstLine) p = firstLine.slice(2).trim();
    if (!firstLine.startsWith('{')) firstLine = '[' + firstLine + ']';
    return p;
}
function body(lines, injections) {
    let tpl = [];
    tpl.push('let html = []');
    for (let line of lines){
        if (line.trim().startsWith(SYMBOL.parameters)) continue;
        let injection = line.trim().match(SYMBOL.injection);
        if (injection) {
            let [x, type, key] = injection;
            let inj = injections[key.trim()] ?? '';
            if (inj && type == 'json') inj = 'const ' + an(key) + ' = ' + inj;
            let text = type ? `<${TYPES[type]} ${type == 'mjs' ? `type='module'` : ''}>${inj}</${TYPES[type]}>` : inj;
            tpl.push('html.push(`' + text + '`)');
        } else if (line.trim().startsWith(SYMBOL.script)) {
            tpl.push(line.replace(SYMBOL.script, '').trim());
        } else {
            tpl.push('html.push(`' + line + '`)');
        }
    }
    tpl.push(`return html.join('\\n')`);
    return tpl;
}
const an = (s)=>s.replaceAll(/[^a-z0-9]/gi, '_');
function importable(func, fname) {
    let fdec = 'export default function';
    if (fname) fdec = 'export function ' + an(fname);
    return func.toString().replace('function anonymous', fdec);
}
function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject)=>{
        methods = {
            async resolve (value) {
                await value;
                state = "fulfilled";
                resolve(value);
            },
            reject (reason) {
                state = "rejected";
                reject(reason);
            }
        };
    });
    Object.defineProperty(promise, "state", {
        get: ()=>state
    });
    return Object.assign(promise, methods);
}
function delay(ms, options = {}) {
    const { signal  } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject)=>{
        const abort = ()=>{
            clearTimeout(i);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = ()=>{
            signal?.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, {
            once: true
        });
    });
}
class MuxAsyncIterator {
    iteratorCount = 0;
    yields = [];
    throws = [];
    signal = deferred();
    add(iterable) {
        ++this.iteratorCount;
        this.callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async callIteratorNext(iterator) {
        try {
            const { value , done  } = await iterator.next();
            if (done) {
                --this.iteratorCount;
            } else {
                this.yields.push({
                    iterator,
                    value
                });
            }
        } catch (e) {
            this.throws.push(e);
        }
        this.signal.resolve();
    }
    async *iterate() {
        while(this.iteratorCount > 0){
            await this.signal;
            for(let i = 0; i < this.yields.length; i++){
                const { iterator , value  } = this.yields[i];
                yield value;
                this.callIteratorNext(iterator);
            }
            if (this.throws.length) {
                for (const e of this.throws){
                    throw e;
                }
                this.throws.length = 0;
            }
            this.yields.length = 0;
            this.signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
const ERROR_SERVER_CLOSED = "Server closed";
const INITIAL_ACCEPT_BACKOFF_DELAY = 5;
const MAX_ACCEPT_BACKOFF_DELAY = 1000;
class Server {
    #port;
    #host;
    #handler;
    #closed = false;
    #listeners = new Set();
    #httpConnections = new Set();
    #onError;
    constructor(serverInit){
        this.#port = serverInit.port;
        this.#host = serverInit.hostname;
        this.#handler = serverInit.handler;
        this.#onError = serverInit.onError ?? function(error) {
            console.error(error);
            return new Response("Internal Server Error", {
                status: 500
            });
        };
    }
    async serve(listener) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#trackListener(listener);
        try {
            return await this.#accept(listener);
        } finally{
            this.#untrackListener(listener);
            try {
                listener.close();
            } catch  {}
        }
    }
    async listenAndServe() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listen({
            port: this.#port ?? 80,
            hostname: this.#host ?? "0.0.0.0",
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    async listenAndServeTls(certFile, keyFile) {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        const listener = Deno.listenTls({
            port: this.#port ?? 443,
            hostname: this.#host ?? "0.0.0.0",
            certFile,
            keyFile,
            transport: "tcp"
        });
        return await this.serve(listener);
    }
    close() {
        if (this.#closed) {
            throw new Deno.errors.Http(ERROR_SERVER_CLOSED);
        }
        this.#closed = true;
        for (const listener of this.#listeners){
            try {
                listener.close();
            } catch  {}
        }
        this.#listeners.clear();
        for (const httpConn of this.#httpConnections){
            this.#closeHttpConn(httpConn);
        }
        this.#httpConnections.clear();
    }
    get closed() {
        return this.#closed;
    }
    get addrs() {
        return Array.from(this.#listeners).map((listener)=>listener.addr);
    }
    async #respond(requestEvent, httpConn, connInfo) {
        let response;
        try {
            response = await this.#handler(requestEvent.request, connInfo);
        } catch (error) {
            response = await this.#onError(error);
        }
        try {
            await requestEvent.respondWith(response);
        } catch  {
            return this.#closeHttpConn(httpConn);
        }
    }
    async #serveHttp(httpConn1, connInfo1) {
        while(!this.#closed){
            let requestEvent1;
            try {
                requestEvent1 = await httpConn1.nextRequest();
            } catch  {
                break;
            }
            if (requestEvent1 === null) {
                break;
            }
            this.#respond(requestEvent1, httpConn1, connInfo1);
        }
        this.#closeHttpConn(httpConn1);
    }
    async #accept(listener) {
        let acceptBackoffDelay;
        while(!this.#closed){
            let conn;
            try {
                conn = await listener.accept();
            } catch (error1) {
                if (error1 instanceof Deno.errors.BadResource || error1 instanceof Deno.errors.InvalidData || error1 instanceof Deno.errors.UnexpectedEof || error1 instanceof Deno.errors.ConnectionReset || error1 instanceof Deno.errors.NotConnected) {
                    if (!acceptBackoffDelay) {
                        acceptBackoffDelay = INITIAL_ACCEPT_BACKOFF_DELAY;
                    } else {
                        acceptBackoffDelay *= 2;
                    }
                    if (acceptBackoffDelay >= 1000) {
                        acceptBackoffDelay = MAX_ACCEPT_BACKOFF_DELAY;
                    }
                    await delay(acceptBackoffDelay);
                    continue;
                }
                throw error1;
            }
            acceptBackoffDelay = undefined;
            let httpConn2;
            try {
                httpConn2 = Deno.serveHttp(conn);
            } catch  {
                continue;
            }
            this.#trackHttpConnection(httpConn2);
            const connInfo2 = {
                localAddr: conn.localAddr,
                remoteAddr: conn.remoteAddr
            };
            this.#serveHttp(httpConn2, connInfo2);
        }
    }
    #closeHttpConn(httpConn3) {
        this.#untrackHttpConnection(httpConn3);
        try {
            httpConn3.close();
        } catch  {}
    }
    #trackListener(listener1) {
        this.#listeners.add(listener1);
    }
    #untrackListener(listener2) {
        this.#listeners.delete(listener2);
    }
    #trackHttpConnection(httpConn4) {
        this.#httpConnections.add(httpConn4);
    }
    #untrackHttpConnection(httpConn5) {
        this.#httpConnections.delete(httpConn5);
    }
}
async function serve(handler, options = {}) {
    const server = new Server({
        port: options.port ?? 8000,
        hostname: options.hostname ?? "0.0.0.0",
        handler,
        onError: options.onError
    });
    if (options?.signal) {
        options.signal.onabort = ()=>server.close();
    }
    return await server.listenAndServe();
}
class Routes {
    ROUTES = {};
    add(p = {}) {
        this.ROUTES = {
            ...this.ROUTES,
            ...p
        };
    }
    find(request) {
        let url = request.url;
        for(let route in this.ROUTES){
            let pattern = new URLPattern({
                pathname: route
            });
            if (pattern.test(url)) return {
                function: this.ROUTES[route],
                path: pattern.exec(url).pathname.groups,
                route
            };
        }
    }
}
const importMeta = {
    url: "file:///Volumes/code/GitHub/js-max-pub/pager/src/crypto.js",
    main: false
};
const bytesToBase64 = (bytes)=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const lineLimit = (string, limit = 80)=>string.match(new RegExp(`.{1,${limit}}`, 'g')).join('\n');
async function SHA(string, n = 512) {
    let input = new TextEncoder().encode(string);
    let hash = await crypto.subtle.digest(`SHA-${n}`, input);
    let hex = bytesToBase64(hash);
    return hex;
}
const cryptoKeyToBase64 = async (key, encoding)=>bytesToBase64(await window.crypto.subtle.exportKey(encoding, key));
async function getCryptoKeys() {
    const keys = await window.crypto.subtle.generateKey({
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([
            0x01,
            0x00,
            0x01
        ]),
        hash: {
            name: 'SHA-256'
        }
    }, true, [
        'sign',
        'verify'
    ]);
    let publicKey = await cryptoKeyToBase64(keys.publicKey, 'spki');
    let privateKey = await cryptoKeyToBase64(keys.privateKey, 'pkcs8');
    return {
        public: `-----BEGIN CERTIFICATE-----\n${lineLimit(publicKey, 64)}\n-----END CERTIFICATE-----`,
        private: `-----BEGIN PRIVATE KEY-----\n${lineLimit(privateKey, 64)}\n-----END PRIVATE KEY-----`
    };
}
if (importMeta.main) {
    let keys = await getCryptoKeys();
    console.log(keys);
    Deno.writeTextFileSync('public.pem', keys.public);
    Deno.writeTextFileSync('private.pem', keys.private);
}
const mod5 = await async function() {
    return {
        SHA: SHA
    };
}();
class Users {
    USERS = {};
    add(p = {}) {
        this.USERS = {
            ...this.USERS,
            ...p
        };
    }
    async find(request) {
        let auth = request.headers.get('Authorization');
        if (!auth?.toLowerCase()?.startsWith('basic ')) return;
        auth = auth.slice(6);
        let [user, pass] = atob(auth).split(':');
        if (this.USERS[user] == pass) return user;
        if (this.USERS[user] == await SHA(pass)) return user;
    }
}
const std = (content, status, headers = {})=>new Response(content, {
        status,
        headers
    });
const ct = (type)=>({
        "content-type": `${type}; charset=utf-8`
    });
const redirect = (url)=>std('', 307, {
        Location: url
    });
const logout = (html)=>std(html, 401, ct('text/html'));
const unauthorized = (html)=>std(html, 401, {
        ...ct('text/html'),
        "WWW-Authenticate": "Basic"
    });
const notFound = (html)=>std(html, 404, ct('text/html'));
const OK = (content, type)=>std(content, 200, {
        ...ct(type)
    });
const html = (p)=>OK(p, 'text/html');
const json = (p)=>OK(p, 'application/json');
const text = (p)=>OK(p, 'text/plain');
const user = ({ USER  })=>OK(USER, 'text/plain');
const mod6 = {
    std: std,
    ct: ct,
    redirect: redirect,
    logout: logout,
    unauthorized: unauthorized,
    notFound: notFound,
    OK: OK,
    html: html,
    json: json,
    text: text,
    user: user
};
let log = new Log('pager');
class Pager {
    routes = new Routes();
    users = new Users();
    constructor({ port =8000  } = {}){
        log.info(`starting pager on port ${port}`);
        serve((x)=>this.request(x), {
            port
        });
    }
    async request(request) {
        let route = this.routes.find(request);
        if (!route) return notFound();
        let USER = await this.users.find(request);
        let queryString = Object.fromEntries(new URLSearchParams(new URL(request.url).search));
        let HEAD = Object.fromEntries(request.headers);
        let FORM;
        if (HEAD['content-type'] == 'application/x-www-form-urlencoded') {
            FORM = await request.formData();
            FORM = Object.fromEntries(FORM);
        }
        log.info(request.url, '->', route.route, '->', `${route.function.name}(@${USER}, ${JSON.stringify(route.path)}, ${JSON.stringify(queryString)})`);
        return await route.function({
            ...route.path,
            ...queryString,
            USER,
            HEAD,
            FORM,
            request
        });
    }
}
export { Pager as Pager };
const redirect1 = (url, time = 0)=>`<meta http-equiv="refresh" content="${time}; URL=${url}">`;
const charset = (x = 'utf-8')=>`<meta charset="${x}"/>`;
const viewport = (x)=>`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`;
const message = (x)=>`<h1 style="text-align: center; margin-top:7em; font-family: sans-serif; font-size:50px;">${x}</h1>`;
const mod7 = {
    redirect: redirect1,
    charset: charset,
    viewport: viewport,
    message: message
};
export { mod5 as crypto };
export { mod6 as response };
export { mod7 as html };
function node(name, attributes = {}, children = []) {
    let attr = Object.entries(attributes).filter((x)=>x[1] !== undefined).map((x)=>`${x[0].replace('_', '-')}="${x[1]}"`).join(' ');
    return `<${name} ${attr}` + (children.length ? `>${children.join('')}</${name}>` : '/>');
}
function style(css) {
    return `<style>${css}</style>`;
}
function frame({ width =100 , height =100 , inline =false , ...x } = {}, children = []) {
    return node('svg', {
        viewbox: '0 0 ' + width + ' ' + height,
        width: inline ? undefined : width + 'px',
        height: inline ? undefined : height + 'px',
        xmlns: "http://www.w3.org/2000/svg",
        version: "1.1"
    }, children);
}
function xy2wh(p1, p2) {
    if (p2.width) return p2;
    else return {
        width: Math.abs(p1.x - p2.x),
        height: Math.abs(p1.y - p2.y)
    };
}
function dotted(x) {
    if (!x.dotted) return {};
    return {
        stroke_dasharray: '0 ' + (x.width ?? WIDTH) * 2
    };
}
function dashed(x) {
    if (!x.dashed) return {};
    let w = x.width ?? WIDTH;
    return {
        stroke_dasharray: w * 2 + ' ' + w * 4
    };
}
function rect(p1, p2, { ...x } = {}) {
    return node('rect', {
        ...p1,
        ...xy2wh(p1, p2),
        fill: x.color ?? 'gray',
        ...x
    });
}
function js2css(x) {
    return [
        x.color ? `stroke: ${x.color}` : '',
        x.width ? `stroke-width: ${x.width}` : ''
    ].filter((x)=>x).join(';');
}
const num = (x)=>Number(x).toFixed(1);
function line(p1, p2, x = {}, children = []) {
    const cssmap = {
        color: 'stroke',
        width: 'stroke-width'
    };
    return node('line', {
        x1: num(p1.x),
        y1: num(p1.y),
        x2: num(p2.x),
        y2: num(p2.y),
        ...dotted(x),
        ...dashed(x),
        ...kill1(x, ...Object.keys(cssmap)),
        style: js2css(x)
    }, children);
}
function lines2(points = [], x = {}) {
    return group(points.slice(1).map((p, i)=>line(points[i], p, x)));
}
let ps = (p)=>p.x + ' ' + p.y;
function polyline(points = [], x = {}) {
    return node('polyline', {
        points: points.map((p)=>ps(p)).join(' '),
        stroke_width: x.width ?? WIDTH,
        stroke: x.color ?? 'gray',
        fill: 'transparent',
        ...dotted(x),
        ...x
    });
}
function path(points = [], { width =WIDTH , color ='gray' , close =true , ...x } = {}) {
    let d = 'M ' + ps(points[0]) + points.slice(1).map((p)=>'L ' + ps(p)).join(' ') + (close ? 'Z' : '');
    return node('path', {
        d,
        stroke_width: width,
        stroke: color,
        fill: 'transparent',
        ...dotted(x),
        ...x
    });
}
function circle(p, { radius =WIDTH , color ='gray' , ...x } = {}) {
    return node('circle', {
        cx: p.x,
        cy: p.y,
        r: radius,
        fill: color,
        ...x
    });
}
function text1(p, { text ='text...' , color ='gray' , center =false , ...x } = {}) {
    return node('text', {
        ...p,
        fill: color,
        class: x.class ?? '',
        ...x
    }, [
        text
    ]);
}
function group(children = [], attributes = {}) {
    return node('g', attributes, children);
}
class SVG {
    _children = [];
    constructor(w = 100, h = 100){
        this.dim = {
            w,
            h
        };
        this.style(CSS);
    }
    style(p) {
        console.log('add style', p.length);
        this._children.push(`<style>${p}</style>`);
        return this;
    }
    child(c) {
        this._children.push(c);
        return this;
    }
    get children() {
        return this._children;
    }
    toString() {
        return frame(this.dim, this.children);
    }
}
function circleWithLetter(p, circle1 = {}, letter = {}, options = {}) {
    let font_size = circle1.radius * 2 - 2;
    return group([
        circle(p, {
            radius: circle1.radius ?? 10,
            color: circle1.color ?? 'gray',
            ...circle1
        }),
        text1(p, {
            font_size,
            color: letter.color ?? 'white',
            text: letter.text ?? 'X',
            class: letter.class ?? 'center',
            ...letter
        })
    ], {
        class: 'circle-with-letter',
        ...options
    });
}
const ABC = (x)=>String.fromCharCode(65 + x);
function lineLength(p1, p2) {
    return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5;
}
function lineFragment(p1, p2, distance = 10) {
    let len = lineLength(p1, p2);
    return {
        x: (p2.x - p1.x) / len * distance,
        y: (p2.y - p1.y) / len * distance
    };
}
function pointOnLine(p1, p2, distance = 50) {
    let fragment = lineFragment(p1, p2, distance);
    return {
        x: p1.x + fragment.x,
        y: p1.y + fragment.y
    };
}
function lineBubbles(p1, p2, x = {}) {
    return circleWithLetter(pointOnLine(p1, p2, x.distance), x, x) + circleWithLetter(pointOnLine(p2, p1, x.distance), x, x);
}
function lineWithBubbles(p1, p2, line1 = {}, bubble = {}) {
    return group([
        line(p1, p2, line1),
        lineBubbles(p1, p2, bubble)
    ]);
}
const deg2rad = (deg)=>deg * Math.PI / 180.0;
const pointOnCircle = (c, r, deg)=>({
        x: c.x + r * Math.cos(deg2rad(deg - 90)),
        y: c.y + r * Math.sin(deg2rad(deg - 90))
    });
const pointsOnCircle = (c, r, count)=>Array(count).fill(1).map((x, i)=>pointOnCircle(c, r, 360 / count * i));
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
    };
}
function describeArc(x, y, radius, startAngle, endAngle, o = {}) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        "M",
        start.x,
        start.y,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
        "L",
        start.x,
        start.y,
        "Z"
    ].join(" ");
    return d;
}
function arc(...p) {
    return node('path', {
        d: describeArc(...p)
    });
}
const mod8 = {
    circleWithLetter: circleWithLetter,
    ABC: ABC,
    lineLength: lineLength,
    lineFragment: lineFragment,
    pointOnLine: pointOnLine,
    lineBubbles: lineBubbles,
    lineWithBubbles: lineWithBubbles,
    deg2rad: deg2rad,
    pointOnCircle: pointOnCircle,
    pointsOnCircle: pointsOnCircle,
    arc: arc,
    node,
    style,
    frame,
    xy2wh,
    rect,
    line,
    lines: lines2,
    polyline,
    path,
    circle,
    text: text1,
    group,
    SVG
};
export { Log as Log };
export { TALI as TALI };
export { parseDate as parseDate, isoDate as isoDate, isoDateTime as isoDateTime, format as dateFormat, humanDuration as humanDuration, date as date };
export { intersection as intersection, difference as difference, sortBy as sortBy, cluster as cluster, unique as unique };
export { sum as sum, average as average, median as median };
export { select as select, mapValues as mapValues, filter as dictFilter, sortByKey as sortByKey };
export { template as template, importable as importable };
export { mod1 as FS };
export { mod8 as svg };
export { mod2 as CSV };
