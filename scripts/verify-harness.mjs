import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';

const validator = path.join(homedir(), '.agents/skills/harness-creator/scripts/validate-harness.mjs');
console.log('Checking agent-harness structure only; this is not an application test/build or OCR smoke run.');
const result = spawnSync(process.execPath, [validator, '--target', process.cwd()], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
