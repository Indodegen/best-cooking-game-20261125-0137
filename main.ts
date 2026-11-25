// Golden Ladle — Rush Hour Kitchen: the hand-in program (Node 22, standard
// library only). It copies this repository's game/ and screenshots/ beside it
// into /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library. The game itself is plain static files
// a desktop browser loads offline (game/index.html and its ES modules, no
// library and no network request). Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Every path resolves from this file, never from the working directory: the
// grader runs main.ts from a directory of its own.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const from = join(here, name);
  const to = join(out, name);
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(out, { recursive: true });
copyTree('game');
copyTree('screenshots');

// The gate's own caps: the dossier text is capped at 160 KiB, at most 4
// screenshots of at most 256 KiB each, and game/ holds at most 993 files and
// directories within 48 MiB, every path within 1,000 bytes. The program
// refuses nothing itself; it hands the files in exactly as they stand.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
