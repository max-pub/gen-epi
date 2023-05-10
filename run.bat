
deno run -A  --v8-flags=--max-old-space-size=8192  1.dist.gen/run.js %1
deno run -A  --v8-flags=--max-old-space-size=8192  1.dist.epi/run.js %1
deno run -A  --v8-flags=--max-old-space-size=8192  2.stat/run.js %1
