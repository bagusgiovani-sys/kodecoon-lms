import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const here = (f) => fileURLToPath(new URL(f, import.meta.url))
const sql = readFileSync(fileURLToPath(new URL('../../schema.sql', import.meta.url)),'utf8')
  .split('\r\n').join('\n')
  .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

const tables = [...sql.matchAll(/create table (\w+)/g)].map(m => m[1])
const policies = [...sql.matchAll(/create policy "([^"]+)" on (\w+)([\s\S]*?);\n/g)]
  .map(m => ({ name: m[1], table: m[2], body: m[3] }))

const edges = new Map()
for (const p of policies) {
  // tokenize on anything that is not a word char -- no backslash escapes needed
  const toks = p.body.toLowerCase().replace(/[^a-z0-9_]+/g, ' ').trim().split(' ')
  const reads = new Set()
  for (let i = 0; i < toks.length - 1; i++) {
    if ((toks[i] === 'from' || toks[i] === 'join') && tables.includes(toks[i+1]) && toks[i+1] !== p.table)
      reads.add(toks[i+1])
  }
  p.reads = [...reads]
  if (!edges.has(p.table)) edges.set(p.table, new Set())
  reads.forEach(r => edges.get(p.table).add(r))
}

console.log(`policies parsed: ${policies.length}`)
console.log('\n=== policy -> tables it reads under RLS ===')
for (const p of policies) if (p.reads.length)
  console.log(`  ${p.table.padEnd(22)} ${p.name.padEnd(34)} -> ${p.reads.join(', ')}`)

const cycles = []
;(function findAll() {
  for (const start of edges.keys()) {
    const walk = (node, path) => {
      for (const nxt of (edges.get(node) ?? [])) {
        const i = path.indexOf(nxt)
        if (i !== -1) {
          const c = [...path.slice(i), nxt]
          const key = [...new Set(c)].sort().join('|')
          if (!cycles.some(x => x.key === key)) cycles.push({ key, c })
          continue
        }
        if (path.length > 6) continue
        walk(nxt, [...path, nxt])
      }
    }
    walk(start, [start])
  }
})()

console.log('\n=== CYCLES (each aborts every query on these tables with 42P17) ===')
cycles.length ? cycles.forEach(c => console.log('  ' + c.c.join(' -> '))) : console.log('  none')
