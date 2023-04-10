#!/bin/bash
# deno run -A ../_js/template/compile.js ./lib/html/ ./lib/html/.templates.js
# deno run -A ../_js/template/compile.js ./lib/html/ ./build/js/templates.js
# deno run -A ./hygi.js
deno run -A  --v8-flags=--max-old-space-size=8192  1.dist.gen/run.js $1
deno run -A  --v8-flags=--max-old-space-size=8192  1.dist.epi/run.js $1
deno run -A  --v8-flags=--max-old-space-size=8192  2.stat/run.js $1
python3 3.plot/gen.epi.py