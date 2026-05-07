import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = process.cwd();
const outdir = join(rootDir, 'build');
const assetsDir = join(outdir, 'assets');
const bundlePath = join(assetsDir, 'index.js');

async function buildApp() {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  await build({
    entryPoints: [join(rootDir, 'src', 'main.jsx')],
    bundle: true,
    outfile: bundlePath,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    loader: {
      '.png': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.svg': 'file',
      '.gif': 'file',
      '.webp': 'file',
    },
    sourcemap: false,
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  const template = await readFile(join(rootDir, 'index.html'), 'utf8');
  const html = template.replace('<!-- build.mjs injects the app bundle here -->', '<script src="assets/index.js" defer></script>');
  await writeFile(join(outdir, 'index.html'), html, 'utf8');
  console.log('Build complete');
}

await buildApp();
