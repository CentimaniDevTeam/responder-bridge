const fs = require('fs');
const path = require('path');

function createMaterialsLoader() {
  return {
    async load(paths) {
      const blocks = [];
      for (const p of paths) {
        const abs = path.resolve(p);
        const content = fs.readFileSync(abs, 'utf8');
        const label = path.basename(p);
        blocks.push(`=== ${label} ===\n${content}`);
      }
      return blocks.join('\n\n');
    }
  };
}

module.exports = { createMaterialsLoader };
