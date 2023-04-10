
import os
import lib
import sys
# import plot
import numpy
from matplotlib import pyplot
# pyplot.style.use('seaborn-whitegrid')
from matplotlib import ticker

input = f'../_data/stat/gen.epi/'
output = f'../_data/plot/gen.epi/'

xmax = 20
xsteps = 1
xmargin = 0.2

ymax = 100
ysteps = 10
ymargin = 1

accsep = 'sep'


def graph(data,germ,stat):
	lib.create(title= f'{germ}   {stat}', x=f'cgMLST - distance', y=f'relative amount of epidemiological connections', size=(8,4))
	pyplot.xlim(-xmargin, xmax+xmargin)
	pyplot.ylim(-ymargin, ymax+ymargin)
	
	ax = pyplot.gca()
	ax.yaxis.set_major_formatter(ticker.PercentFormatter(decimals=0))

	pyplot.xticks(numpy.arange(0, xmax+xmargin, xsteps))
	pyplot.yticks(numpy.arange(0, ymax+ymargin, ysteps))

	# enu = list(enumerate(data))
	# data.entrie
	# print(enu)
	for k,v in data.items():
		# d = data[key]#[:xmax+1]
		x = [int(x) for x in v.keys()]
		y = [float(x) for x in v.values()]
		# if isinstance(key,int) or key.isdigit():
		# 	label = 'any contact, '
		# 	label += 'overlapping stay' if key == 0 else f'up to {key} days contact delay'
		# else:
		# 	label = key + ' contact, overlapping stay'
		pyplot.plot(x,y, marker='.', markersize=4, linestyle='solid', label=k,linewidth=0.2,alpha=1)#, color=lib.TYPE_COLORS[type], alpha=1-day*0.03)
		# color=lib.KEY_COLORS[key],label='x'
			
	os.makedirs(f'{output}/{germ}/',exist_ok=True)
	lib.save(f'{output}/{germ}/{stat}.png', legend='upper center', y='left')





# print("args", sys.argv[1])
for germ in os.listdir(input):
	if germ[0] == '.': continue
	if len(sys.argv) > 1 and sys.argv[1] != germ: continue
	print(germ)
	for stat in os.listdir(input+'/'+germ):
		print(germ,stat)
		try: data = lib.loadTALI(f'{input}/{germ}/{stat}')#, orient='columns')
		except: continue
		# print(data['REL'])
		graph(data['REL'],germ,stat)

