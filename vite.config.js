import { defineConfig } from "vite";

// Cross-origin isolation lets onnxruntime-web use WebAssembly threads
// (SharedArrayBuffer). Without it homr-web still works: WebGPU needs no
// isolation, and WebAssembly falls back to one thread.
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  // From homr-web's README: OpenCV.js is a UMD bundle reached only from the
  // Worker, so Vite must pre-bundle it; homr-web and onnxruntime-web must not be
  // pre-bundled, or the Worker URL and the .wasm lookups break in dev.
  optimizeDeps: {
    exclude: ["homr-web", "onnxruntime-web"],
    include: ["homr-web > @techstark/opencv-js"],
  },
});
