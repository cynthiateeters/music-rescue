import { createRecognizer } from "homr-web";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

// Files in samples/. A sample with an .expected.musicxml beside it is one of
// homr-web's own test pages, so its output can be checked against homr's.
const SAMPLES = [
  { file: "the-kesh-300dpi.png", label: "The Kesh (melody, baseline)", expected: true },
  { file: "grand-staff-300dpi.png", label: "Grand Staff Study (piano, baseline)", expected: true },
  {
    file: "chord-study-300dpi.png",
    label: "Chord Study (chord symbols, baseline)",
    expected: true,
  },
  { file: "bazzini-ronde-des-lutins-p1.png", label: "Bazzini, La Ronde des Lutins (scan)" },
  { file: "bach-bwv1-bga-1851-p1.jpg", label: "Bach, BWV 1, 1851 edition (low-res scan)" },
  { file: "star-spangled-banner-lyrics.png", label: "Star-Spangled Banner with lyrics (small)" },
  { file: "photo-music-stand-usaf-peru.jpg", label: "Saxophone part on a stand (photo)" },
];

const $ = (id) => document.getElementById(id);
const el = {
  status: $("engine-status"),
  backend: $("engine-backend"),
  isolated: $("engine-isolated"),
  sample: $("sample"),
  file: $("file"),
  preview: $("preview"),
  previewImg: $("preview-img"),
  previewCaption: $("preview-caption"),
  run: $("run"),
  cancel: $("cancel"),
  progress: $("progress"),
  result: $("result"),
  outcome: $("result-outcome"),
  time: $("result-time"),
  staves: $("result-staves"),
  texts: $("result-texts"),
  compare: $("result-compare"),
  download: $("download"),
  xmlDetails: $("xml-details"),
  xml: $("xml"),
  logDetails: $("log-details"),
  log: $("log"),
  notation: $("notation"),
  notationStatus: $("notation-status"),
  score: $("score"),
};

let recognizer = null;
let osmd = null; // created on first render, reused after
let chosen = null; // { blob, name, expectedUrl }
let controller = null;
let lastXml = "";

for (const s of SAMPLES) {
  const option = document.createElement("option");
  option.value = s.file;
  option.textContent = s.label;
  el.sample.append(option);
}

el.isolated.textContent = self.crossOriginIsolated ? "Yes" : "No (WebAssembly will use one thread)";

try {
  recognizer = await createRecognizer({ baseUrl: "/models/" });
  el.status.textContent = "Ready";
  el.backend.textContent = recognizer.backendReason
    ? `${recognizer.backend} (${recognizer.backendReason})`
    : recognizer.backend;
} catch (err) {
  el.status.textContent = `Could not start: ${err.message}`;
}

function updateRunButton() {
  el.run.disabled = !(recognizer && chosen && !controller);
}

function showPreview(blob, caption) {
  if (el.previewImg.src) URL.revokeObjectURL(el.previewImg.src);
  el.previewImg.src = URL.createObjectURL(blob);
  el.previewImg.alt = `Preview of ${caption}`;
  el.previewCaption.textContent = caption;
  el.preview.hidden = false;
}

el.sample.addEventListener("change", async () => {
  const s = SAMPLES.find((x) => x.file === el.sample.value);
  el.file.value = "";
  chosen = null;
  updateRunButton();
  if (!s) {
    el.progress.textContent = "";
    return;
  }
  // The Read button stays disabled until the picture arrives, so say why.
  el.progress.textContent = "Loading sample…";
  let blob;
  try {
    const res = await fetch(`/samples/${s.file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    blob = await res.blob();
  } catch (err) {
    el.progress.textContent = `Couldn't load the sample: ${err.message}`;
    return;
  }
  // Another sample may have been chosen while this one loaded.
  if (el.sample.value !== s.file) return;
  el.progress.textContent = "";
  const stem = s.file.replace(/\.[^.]+$/, "");
  chosen = {
    blob,
    name: stem,
    expectedUrl: s.expected ? `/samples/${stem}.expected.musicxml` : null,
  };
  showPreview(blob, s.label);
  updateRunButton();
});

el.file.addEventListener("change", () => {
  const f = el.file.files[0];
  el.sample.value = "";
  el.progress.textContent = "";
  chosen = f ? { blob: f, name: f.name.replace(/\.[^.]+$/, ""), expectedUrl: null } : null;
  if (f) showPreview(f, f.name);
  updateRunButton();
});

// homr-web drops the alpha channel, so a transparent pixel would read as its
// stored color (often black). Paint the image over white first.
async function flattenOntoWhite(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Ignore whitespace between tags, so a formatting difference isn't a mismatch.
const normalizeXml = (s) => s.replace(/>\s+</g, "><").trim();

el.run.addEventListener("click", async () => {
  controller = new AbortController();
  el.cancel.disabled = false;
  updateRunButton();
  el.result.hidden = true;
  el.notation.hidden = true;
  osmd?.clear();
  el.progress.textContent = "Preparing the image…";

  const image = await flattenOntoWhite(chosen.blob);
  const result = await recognizer.recognizePage(image, {
    signal: controller.signal,
    onProgress: ({ stage, done, total }) => {
      el.progress.textContent = total ? `${stage}: ${done} of ${total}` : stage;
    },
  });

  controller = null;
  el.cancel.disabled = true;
  updateRunButton();
  el.progress.textContent = "";
  showResult(result);
});

el.cancel.addEventListener("click", () => controller?.abort());

async function showResult(result) {
  el.result.hidden = false;
  el.time.textContent = `${(result.durationMs / 1000).toFixed(1)} s`;
  el.log.textContent = Array.isArray(result.log) ? result.log.join("\n") : String(result.log ?? "");
  el.logDetails.hidden = !el.log.textContent;

  if (!result.ok) {
    el.outcome.textContent = `Failed: ${result.error}`;
    el.staves.textContent = "–";
    el.texts.textContent = "–";
    el.compare.textContent = "–";
    el.download.hidden = true;
    el.xmlDetails.hidden = true;
    return;
  }

  lastXml = result.musicXml;
  el.outcome.textContent = "Read successfully";
  el.staves.textContent = String(result.staves.length);
  el.texts.textContent = result.texts.length ? result.texts.map((t) => t.text).join(", ") : "none";
  el.xml.textContent = lastXml;
  el.xmlDetails.hidden = false;
  el.download.hidden = false;
  await renderNotation(lastXml);

  if (chosen.expectedUrl) {
    const expected = await (await fetch(chosen.expectedUrl)).text();
    el.compare.textContent =
      normalizeXml(expected) === normalizeXml(lastXml)
        ? "Identical"
        : "Different. Not necessarily wrong: open both in MuseScore to compare.";
  } else {
    el.compare.textContent = "No expected output for this page";
  }
}

// Draw the MusicXML as notation. The container must be visible first, because
// OSMD lays the score out to the container's width. A file OSMD can't draw
// (likely with messy scan output) shows a message instead of breaking the page.
async function renderNotation(xml) {
  el.notation.hidden = false;
  el.notationStatus.textContent = "Drawing the notation…";
  try {
    osmd ??= new OpenSheetMusicDisplay(el.score, { autoResize: true, backend: "svg" });
    await osmd.load(xml);
    osmd.render();
    el.notationStatus.textContent = "";
  } catch (err) {
    osmd?.clear();
    el.notationStatus.textContent = `Couldn't draw this MusicXML: ${err.message}`;
  }
}

el.download.addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([lastXml], { type: "application/vnd.recordare.musicxml+xml" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chosen.name}.musicxml`;
  a.click();
  URL.revokeObjectURL(url);
});
