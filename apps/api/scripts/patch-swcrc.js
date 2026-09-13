const fs = require('fs');
const swcrc = JSON.parse(fs.readFileSync('.swcrc', 'utf8'));
swcrc.module = { type: 'commonjs' };
fs.writeFileSync('.swcrc', JSON.stringify(swcrc, null, 2) + '\n');
console.log('✓ .swcrc patched: module type → commonjs');
