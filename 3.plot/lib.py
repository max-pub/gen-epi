from matplotlib import pyplot
import os
# import StringIO
# GERMS = {
# 	'sta.au': 'SA',
# 	'enco.faec': 'EF',
# 	'esch.coli': 'EC',
# 	'kleb.pneu': 'KP',
# 	'pseu.aeru': 'PA',
# }
GERMS = {
	'sta.au': 'MRSA',
	'enco.faec': 'VRE',
	'esch.coli': 'MDR E. coli',
	# 'kleb.pneu': 'MDR K. pneu.',
	# 'pseu.aeru': 'MDR P. aeru.',
}
# GERMS = {
# 	'sta.au': 'MRSA',
# 	'enco.faec': 'VRE',
# 	'esch.coli': 'MDR E. coli',
# 	'kleb.pneu': 'MDR K. pneumoniae',
# 	'pseu.aeru': 'MDR P. aeruginosa',
# }
GERM_COLORS = {
	'kleb.pneu': 'silver',
	'pseu.aeru': 'silver',
	'esch.coli': '#9ABF96',
	'sta.au': '#74ADC0',
	'enco.faec': '#C85F5F',
}
# MARKER = ['1','2','3','4',]
MARKER = ['<','^','>','v',]
DAY_COLORS = {
	# 0: '#ABD376',
	# 7: '#A793E5',
	# 'pneumo': '#6FBFE4',
	# 7: '#F7D069',
	# 14: '#DC5F68',
	0: '#9ABF96',
	7: '#74ADC0',
	14: '#C85F5F',
}
KEY_COLORS = {
	'room': '#9ABF96',
	'ward': '#74ADC0',
	'clinic': '#C85F5F',
	'any': 'black',
	0: 'black',
	7: 'orange',
	14: 'violet',
	2016: 'black',
	2018: 'orange',
	2020: 'violet',
	# 7: '#02B3D7',
	# 14: '#D7016D',
}
# KEY_COLORS = {
# 	0: '#9ABF96',
# 	7: '#74ADC0',
# 	14: '#C85F5F',
# 	'room': '#9ABF96',
# 	'ward': '#74ADC0',
# 	'clinic': '#C85F5F',
# 	'any': 'silver',
# }
GAP_COLORS = {
	0: '#9ABF96',
	1: '#74ADC0',
	2: '#C85F5F',
}
TYP_COLORS = {
	'nodes': '#9ABF96',
	'edges': '#74ADC0',
	'sizes': '#C85F5F',
	'count': 'orange',
}
def loadTALI(filename):
	from io import StringIO
	with open(filename,"r") as f:
		string = f.read()
	blocks = string.split("\n\n\n")
	data = {}
	# print(blocks)
	for i,block in enumerate(blocks):
		# print(StringIO(block))
		# print(block)
		key = block.split("\t")[0]
		data[key] = loadPanda(StringIO(block))
		# print(data[key])
	return data

def loadPanda(filename, type=str, orient='index'):
	import pandas
	# print("jo")
	return pandas.read_csv(filename, sep='\t', header=0, index_col=0, dtype=type, keep_default_na=False).to_dict(orient=orient)
	
def loadJSON(filename):
	import json
	with open(filename, 'r', encoding='utf8') as f:
		return json.load(f)

def listFolder(folder, hidden=False):
	# return [d for d in os.listdir(folder) if not d.startswith('.') and os.path.isdir(os.path.join(folder, d))]
	output = {}
	for item in os.listdir(folder):
		if not hidden and item.startswith('.'):
			continue
		path = os.path.join(folder, item)
		key = item
		if os.path.isdir(path):
			key = item + '/'
		output[key] = path
	return output


# pyplot.style.use('seaborn-whitegrid')


def create(title='', x='', y='',size=(6,4)):
	pyplot.clf()
	pyplot.figure()
	# pyplot.figure(figsize=(8,4), dpi=80)
	# pyplot.figure(figsize=(6,3))
	pyplot.figure(figsize=size)
	pyplot.title(title)
	pyplot.xlabel(x, fontsize=9, color='#333')
	pyplot.ylabel(y, fontsize=9, color='#333')
	pyplot.grid(color='#eee', linestyle='-', linewidth=0.5)
	# pyplot.legend( prop={'size': 6})
	# pyplot.legend(fontsize=6)


def save(path, legend=None, legCol=1, y='left', close=True):
	print('save plot', path)
	if y=='right':
		ax = pyplot.gca()
		ax.yaxis.tick_right()
		ax.yaxis.set_label_position("right")
	if legend:
		if legend == 'below':
			leg = pyplot.legend(loc="lower center", fontsize=9, ncol=legCol, bbox_to_anchor=(0.5, -0.25), frameon=True)
		else:
			leg = pyplot.legend(loc=legend, fontsize=9, ncol=legCol, frameon=True)
		leg.get_frame().set_facecolor('#f7f7f7')
		leg.get_frame().set_edgecolor('none')
		# for text in leg.get_texts():
		# 	text.set_fontstyle("italic")
	# pyplot.savefig(path, dpi=600, pad_inches=0, bbox_inches='tight')
	pyplot.savefig(path, dpi=600, pad_inches=0.1, bbox_inches='tight')
	# print("close",close)
	if close:
		pyplot.close()
		# print(path,"closed")


def italicString(s):
	return "$\it{" + s +  "}$"

def italic(s):
	return " ".join([italicString(x) for x in s.split(" ")])