// Shared scenario state, persisted between runs so later scenes can start from a snapshot.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SAMPLES = path.join(here, '..', 'samples').replace(/\\/g, '/') + '/';
const FILE = path.join(here, '..', 'state.json');

const data = (() => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } })();
export const state = new Proxy(data, {
  set(t, k, v) { t[k] = v; fs.writeFileSync(FILE, JSON.stringify(t, null, 1)); return true; },
});
