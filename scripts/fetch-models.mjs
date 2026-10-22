// Download the ONNX models homr-web's default catalog uses into
// public/models/<sha256>/<file>, the layout createRecognizer({ baseUrl: "/models/" })
// expects. The file list, sizes and hashes come from the installed homr-web
// package, so they always match the version in package.json. Sources are the
// ones homr-web's tools/download-models.sh uses. Every file is checked against
// its pinned size and SHA-256 before it is moved into place; a file already in
// place with the right hash is skipped.
//
// Run: node scripts/fetch-models.mjs

import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ARTIFACTS, MODEL_ROLES } from '../node_modules/homr-web/dist/models/manifest.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const modelsDir = join(root, 'public', 'models')

const HOMR = 'https://github.com/liebharc/homr/releases/download/onnx_checkpoints'
const RAPIDOCR = 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.9.2/onnx'

// Where each file is published, and whether homr's release wraps it in a zip.
function sourceOf(file) {
  if (file === 'PP-OCRv6_det_small.onnx') return { zip: false, url: `${RAPIDOCR}/PP-OCRv6/det/${file}` }
  if (file === 'PP-OCRv6_rec_small.onnx') return { zip: false, url: `${RAPIDOCR}/PP-OCRv6/rec/${file}` }
  if (file === 'ch_ppocr_mobile_v2.0_cls_mobile.onnx') return { zip: false, url: `${RAPIDOCR}/PP-OCRv4/cls/${file}` }
  if (file.endsWith('_web_fp16.onnx')) throw new Error(`${file} is not in the default catalog`)
  return { zip: true, url: `${HOMR}/${file.replace(/\.onnx$/, '.zip')}` }
}

// The artifacts the default catalog's roles name: each role's CPU model plus
// its WebGPU model when it has one. Leaves out the opt-in WebGPU decoder.
function defaultArtifactIds() {
  const ids = new Set()
  for (const role of Object.values(MODEL_ROLES)) {
    ids.add(role.cpu)
    if (role.onWebgpu?.artifact) ids.add(role.onWebgpu.artifact)
  }
  return [...ids].sort()
}

async function sha256Of(path) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(path), hash)
  return hash.digest('hex')
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

const ids = defaultArtifactIds()
// Scratch lives inside the project so the final rename never crosses volumes.
await mkdir(modelsDir, { recursive: true })
const scratch = await mkdtemp(join(modelsDir, '.download-'))
let fetched = 0
let present = 0

try {
  for (const id of ids) {
    const { sha256, bytes, urlPath } = ARTIFACTS[id]
    const file = urlPath.split('/')[1]
    const target = join(modelsDir, urlPath)

    if (existsSync(target) && (await sha256Of(target)) === sha256) {
      console.log(`present   ${file}`)
      present++
      continue
    }

    const { zip, url } = sourceOf(file)
    console.log(`fetching  ${file} (${(bytes / 1e6).toFixed(1)} MB) from ${new URL(url).host}`)
    const downloaded = join(scratch, file)
    if (zip) {
      const zipPath = join(scratch, 'a.zip')
      await download(url, zipPath)
      // -j drops folders inside the zip; only the named .onnx is extracted.
      execFileSync('unzip', ['-q', '-o', '-j', zipPath, file, '-d', scratch])
      await rm(zipPath)
    } else {
      await download(url, downloaded)
    }

    const size = (await stat(downloaded)).size
    if (size !== bytes) throw new Error(`size mismatch: ${file} is ${size} bytes, manifest pins ${bytes}`)
    const actual = await sha256Of(downloaded)
    if (actual !== sha256) throw new Error(`hash mismatch: ${file} is ${actual}, manifest pins ${sha256}`)

    await mkdir(dirname(target), { recursive: true })
    await rename(downloaded, target)
    console.log(`verified  ${file}`)
    fetched++
  }
} finally {
  await rm(scratch, { recursive: true, force: true })
}

console.log(`public/models/: ${fetched} fetched, ${present} already present, ${ids.length} expected`)
