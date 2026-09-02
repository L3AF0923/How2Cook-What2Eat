import { copyFile } from 'node:fs/promises'
import path from 'node:path'

const distAssets = path.resolve('dist/assets')
const currentEntry = path.join(distAssets, 'index.js')
const legacyEntries = [
  'index-DDA9C8jA.js',
  'index-Baevgul4.js',
  'index-EXyDKrhv.js',
  'index-Dm4UhkCP.js',
  'index-BfFOaMFI.js'
]

await Promise.all(legacyEntries.map((file) => copyFile(currentEntry, path.join(distAssets, file))))
console.log(`Created ${legacyEntries.length} compatibility entry aliases.`)
