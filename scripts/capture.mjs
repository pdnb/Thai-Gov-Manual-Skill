// Run scene modules in order (one browser, logged-in pages reused).
//   node capture.mjs <setup.mjs> <scenesDir> scene1 scene2 ...
// setup.mjs must call configure({...}) from lib.mjs (base URL, out dir, login).
// If SNAP_CMD is set, it runs after each scene with the snapshot name appended (e.g. "bash snap.sh save").
import { execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, close } from './lib.mjs';

const [setup, scenesDir, ...names] = process.argv.slice(2);
if (!setup || !scenesDir || !names.length) {
  console.error('usage: node capture.mjs <setup.mjs> <scenesDir> scene1 [scene2 ...]');
  process.exit(1);
}
await import(pathToFileURL(path.resolve(setup)).href);
await launch();
try {
  for (const n of names) {
    console.log(`\n## ${n}`);
    const mod = await import(pathToFileURL(path.resolve(scenesDir, `${n}.mjs`)).href);
    await mod.default();
    if (process.env.SNAP_CMD) execSync(`${process.env.SNAP_CMD} after-${n}`, { stdio: 'inherit' });
  }
} finally {
  await close();
}
