const { execFileSync } = require('child_process');

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function createFlowmarkToolAdapter(cmd = 'flowmark') {
  return {
    async describe(topic, options = {}) {
      const args = ['describe', topic];
      if (options.lang) args.push('--lang', options.lang);
      return run(cmd, args);
    },
    async params(topic, options = {}) {
      const args = ['params', topic];
      if (options.lang) args.push('--lang', options.lang);
      try {
        return run(cmd, args);
      } catch (_) {
        return null;
      }
    },
    async validate(filePath, options = {}) {
      const args = ['validate', filePath];
      if (options.lang) args.push('--lang', options.lang);
      try {
        const out = run(cmd, args);
        return { ok: true, logText: out };
      } catch (err) {
        const stdout = err.stdout ? err.stdout.toString() : '';
        const stderr = err.stderr ? err.stderr.toString() : '';
        return { ok: false, logText: stdout + stderr };
      }
    }
  };
}

module.exports = { createFlowmarkToolAdapter };
