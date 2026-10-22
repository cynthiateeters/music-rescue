# Music Rescue

Turn a picture of one page of sheet music into a MusicXML file you can edit, right in the browser. Music Rescue reads the page with [homr-web](https://github.com/jymen/homr-web), a browser port of the [homr](https://github.com/liebharc/homr) optical music recognition engine, and draws the result as notation with [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) beside the original so you can check it.

It's a prototype. It reads single-instrument pages (a melody or a piano part) well. In testing, pages with several instruments came out as a single line.

This is the `poc` branch: a proof-of-concept demo site. It offers only the four sample pages that read well, and it has no file upload. `main` keeps the full prototype.

## Beginner's guide

### What you need

- Node.js 22 or newer
- pnpm
- Chrome or Edge on a laptop or desktop for the fastest reading (WebGPU). Other browsers fall back to WebAssembly, which is slower.
- Not a phone, for now. On an iPhone, in both Safari and Chrome, the engine starts, then rejects the first page with "recognize while the worker is idle", so reading fails. Desktop Chrome doesn't do this. The cause isn't known yet. The page's note steers visitors to a laptop or desktop browser.

### Set it up

1. Clone the repo and open its folder.
2. Install the packages: `pnpm install`
3. Download homr's models (about 244 MB, checked against their published hashes): `node scripts/fetch-models.mjs`
4. Start the page: `pnpm dev`
5. Open the address it prints, usually http://localhost:5173/

### Use it

1. Choose one of the sample pages.
2. Choose **Read the page**. The first page takes longer while the models load.
3. Check the notation against the original, then choose **Download MusicXML** and open the file in MuseScore or another notation program to fix what it got wrong.

### How it's organized

- `index.html`, `src/main.js`, `src/style.css`: the page
- `vite.config.js`: the dev server, with the headers WebAssembly threads need. `pnpm build` then `pnpm preview` serves the built page under Deck Rescue's security policy, plus the two script permissions homr-web needs (`'wasm-unsafe-eval'` and `'unsafe-eval'`), to test it the way it would run on Deck Rescue's site.
- `scripts/fetch-models.mjs`: downloads and verifies homr's models into `public/models/`
- `public/samples/`: the four pages the demo offers, copied into the build
- `samples/`: the pages left out of the demo, and `samples/SOURCES.md`, the sources and rights for all of them
- `pnpm-workspace.yaml`: skips an optional native package OpenSheetMusicDisplay doesn't need in the browser, and blocks an install script
- `netlify.toml` and `public/_headers`: the same security and cross-origin headers as `pnpm preview`, for Netlify. `_headers` covers a drag-and-drop deploy, where Netlify ignores `netlify.toml`.

### Deploy the demo

The demo runs at https://music-rescue-poc.netlify.app/, a Netlify site linked to this repo's `poc` branch. The models aren't in the repo, so `netlify.toml` has Netlify's build fetch them first, then run `pnpm build`. Every push to `poc` redeploys. To deploy by hand instead, fetch the models, run `pnpm build`, then drag `dist` onto Netlify's deploy page or run `netlify deploy --prod --dir=dist`. A first visit downloads the reading engine, up to about 190 MB.

## Contributing

This is a personal project in early development. Issues and pull requests are welcome. If you send one:

- Keep dependencies pinned to exact versions, and ask before adding one.
- Open a pull request rather than pushing to `main`.
- Never commit `public/models/` or copyrighted sample images. `.gitignore` already excludes them.

## License

Copyright (c) 2026 Cynthia Teeters.

Music Rescue is licensed under the GNU Affero General Public License version 3 (AGPL-3.0). See `LICENSE`. It has to be: it ships homr-web, which is AGPL-3.0, to the browser. Anyone who uses a deployed copy is entitled to its source. This public repo is that source, and the page links to it in its header and footer. The demo built from this branch links to the `poc` branch, since that's the code it runs. Music Rescue is planned to run as a page at `/music` on the Deck Rescue site, which stays a separate, MIT-licensed project.

Third-party parts keep their own licenses:

- homr-web and homr: AGPL-3.0. homr's license FAQ notes that its model weights were trained partly on data marked for non-commercial use, which is an open legal question for commercial use.
- OpenSheetMusicDisplay: BSD-3-Clause
- The OCR models: Apache-2.0
- The sample pages: see `samples/SOURCES.md`
