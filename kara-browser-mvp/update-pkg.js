const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = 'main.js';
pkg.scripts['electron:dev'] = 'concurrently "npm run dev" "wait-on http://localhost:5173 && electron ."';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json updated successfully!');
