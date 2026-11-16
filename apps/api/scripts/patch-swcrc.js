// Patch la configuration SWC du build NestJS :
// - calcule le chemin ABSOLU du plugin workflow (le chemin du poste de dev
//   n'est pas portable ; un chemin relatif n'est pas résolu par SWC) —
//   le script tourne dans le même environnement que `nest build`, donc
//   __dirname pointe vers le bon node_modules (local comme Docker).
// - assure `module.type: commonjs` (requis par Nest + le plugin workflow)
// - crée le fichier s'il est absent (ex. build Docker où .swcrc n'était
//   pas dans le contexte).
const fs = require('fs');
const path = require('path');

const PLUGIN_WASM = path.join(
  __dirname,
  '..',
  'node_modules',
  '@workflow',
  'swc-plugin',
  'swc_plugin_workflow.wasm',
);

const cible = path.join(__dirname, '..', '.swcrc');
let swcrc;
try {
  swcrc = JSON.parse(fs.readFileSync(cible, 'utf8'));
} catch {
  swcrc = {};
}

swcrc = {
  $schema: 'https://swc.rs/schema.json',
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
    experimental: {
      plugins: [[PLUGIN_WASM, { mode: 'client' }]],
    },
  },
  module: { type: 'commonjs' },
  sourceMaps: true,
};

fs.writeFileSync(cible, JSON.stringify(swcrc, null, 2) + '\n');
console.log('✓ .swcrc patched: module type → commonjs, plugin workflow → ' + PLUGIN_WASM);
