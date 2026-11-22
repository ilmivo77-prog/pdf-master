import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

const PDFJS_ASSET_DIRS = ['cmaps', 'standard_fonts', 'wasm', 'iccs'] as const;

export default defineConfig(({command}) => {
  if (command === 'build' && process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = 'production';
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Serves and copies pdfjs-dist self-hosted CMaps, standard fonts, WASM decoders,
      // and ICC profiles under /pdfjs/ so Organize PDF never makes third-party network requests.
      {
        name: 'pdfjs-self-hosted-assets',
        configureServer(server) {
          server.middlewares.use('/pdfjs', (req, res, next) => {
            const urlPath = (req.url ?? '').split('?')[0];
            const segments = urlPath.replace(/^\/+/, '').split('/');
            const folder = segments[0];
            const fileName = segments.slice(1).join('/');
            if (
              !folder ||
              !fileName ||
              fileName.includes('..') ||
              !(PDFJS_ASSET_DIRS as readonly string[]).includes(folder)
            ) {
              next();
              return;
            }
            const sourceDir = path.resolve(
              ROOT_DIR,
              'node_modules/pdfjs-dist',
              folder
            );
            const fullPath = path.resolve(sourceDir, fileName);
            if (
              !fullPath.startsWith(sourceDir + path.sep) ||
              !fs.existsSync(fullPath) ||
              fs.statSync(fullPath).isDirectory()
            ) {
              next();
              return;
            }
            if (fullPath.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
              res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            } else {
              res.setHeader('Content-Type', 'application/octet-stream');
            }
            fs.createReadStream(fullPath).pipe(res);
          });
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(ROOT_DIR, 'dist');
          if (!fs.existsSync(distDir)) {
            return;
          }
          const distPdfjs = path.resolve(distDir, 'pdfjs');
          for (const folder of PDFJS_ASSET_DIRS) {
            const srcFolder = path.resolve(
              ROOT_DIR,
              'node_modules/pdfjs-dist',
              folder
            );
            const targetFolder = path.resolve(distPdfjs, folder);
            if (fs.existsSync(srcFolder)) {
              fs.cpSync(srcFolder, targetFolder, {recursive: true, force: true});
            }
          }
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(ROOT_DIR, 'dist');
          const srcAssets = path.resolve(ROOT_DIR, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    worker: {
      format: 'es',
    },
    resolve: {
      alias: {
        '@': path.resolve(ROOT_DIR, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
