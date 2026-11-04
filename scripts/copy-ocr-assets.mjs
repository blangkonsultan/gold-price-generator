import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const destination = path.resolve('public/ocr');
await Promise.all(['core', 'lang', 'licenses'].map(name => mkdir(path.join(destination, name), { recursive: true })));
const assets = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt', 'licenses/worker-LICENSE.txt'],
  ['node_modules/tesseract.js/LICENSE.md', 'licenses/tesseract-LICENSE.txt'],
  ['node_modules/tesseract.js-core/LICENSE', 'licenses/core-LICENSE.txt'],
  ['node_modules/@fontsource/roboto/LICENSE', 'licenses/roboto-OFL.txt'],
  ['node_modules/@fontsource/montserrat/LICENSE', 'licenses/montserrat-OFL.txt'],
  ['node_modules/@tesseract.js-data/eng/package.json', 'licenses/language-package.json'],
  ['node_modules/@tesseract.js-data/eng/README.md', 'licenses/language-README.md'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'lang/eng.traineddata.gz'],
  ...['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'].map(name => ['node_modules/tesseract.js-core/' + name, 'core/' + name]),
];
await Promise.all(assets.map(([source, target]) => copyFile(path.resolve(source), path.join(destination, target))));
console.log(`Prepared ${assets.length} pinned OCR assets under public/ocr; photos are not uploaded.`);
