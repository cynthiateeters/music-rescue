import { defineConfig } from "vite";

// Cross-origin isolation lets onnxruntime-web use WebAssembly threads
// (SharedArrayBuffer). Without it homr-web still works: WebGPU needs no
// isolation, and WebAssembly falls back to one thread.
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

// Deck Rescue's security policy (deck-rescue/vite.config.js, policy()), with two additions
// for /music, both in script-src:
// - 'wasm-unsafe-eval': homr-web runs its models and OpenCV.js as WebAssembly.
// - 'unsafe-eval': onnxruntime-web and OpenCV.js build JavaScript functions from strings at
//   startup (Emscripten's embind), so homr-web can't start without it (phase 1 of
//   reports/music-rescue-gemini-fixes.md in the REA wiki, 2026-10-22). Cynthia allowed it
//   for /music/* only; Deck Rescue's other pages keep their stricter policy. Sent by `vite preview` only: the dev server injects CSS as inline
// <style> tags, which style-src 'self' would block, so dev-mode results would be noise.
const MUSIC_POLICY = [
  "default-src 'self'",
  "img-src 'self' blob:",
  "worker-src 'self'",
  "style-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

// The other headers Deck Rescue's netlify.toml sends.
const securityHeaders = {
  "Content-Security-Policy": MUSIC_POLICY,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default defineConfig({
  worker: { format: "es" },
  server: { headers: isolationHeaders },
  preview: { headers: { ...isolationHeaders, ...securityHeaders } },
  // From homr-web's README: OpenCV.js is a UMD bundle reached only from the
  // Worker, so Vite must pre-bundle it; homr-web and onnxruntime-web must not be
  // pre-bundled, or the Worker URL and the .wasm lookups break in dev.
  optimizeDeps: {
    exclude: ["homr-web", "onnxruntime-web"],
    include: ["homr-web > @techstark/opencv-js"],
  },
});
