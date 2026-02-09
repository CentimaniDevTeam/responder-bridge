const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function createFileArtifactStore(outDir) {
  const base = path.resolve(outDir);
  const inputsDir = path.join(base, 'inputs');
  const iterationsDir = path.join(base, 'iterations');
  const finalDir = path.join(base, 'final');

  return {
    async init() {
      ensureDir(base);
      ensureDir(inputsDir);
      ensureDir(iterationsDir);
      ensureDir(finalDir);
    },
    async writeInput(name, content) {
      fs.writeFileSync(path.join(inputsDir, name), content, 'utf8');
    },
    async writeIteration(iteration, files) {
      const dir = path.join(iterationsDir, `iter-${String(iteration).padStart(2, '0')}`);
      ensureDir(dir);
      for (const [file, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
      }
    },
    async writeFinal(files) {
      for (const [file, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(finalDir, file), content, 'utf8');
      }
    },
    async writeMeta(meta) {
      fs.writeFileSync(path.join(base, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
    }
  };
}

module.exports = { createFileArtifactStore };
