const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ResponderBridge, createFileArtifactStore } = require('../src');

class MockProvider {
  constructor() {
    this.calls = 0;
  }
  async generate() {
    this.calls += 1;
    return { text: this.calls === 1 ? 'DRAFT' : 'FIXED' };
  }
}

class MockTool {
  constructor() {
    this.validateCalls = 0;
  }
  async describe() { return 'DESC'; }
  async params() { return null; }
  async validate() {
    this.validateCalls += 1;
    if (this.validateCalls === 1) return { ok: false, logText: 'bad' };
    return { ok: true, logText: 'ok' };
  }
}

(async () => {
  const outDir = path.join(os.tmpdir(), `rb-test-${Date.now()}`);
  const bridge = new ResponderBridge({
    provider: new MockProvider(),
    tool: new MockTool(),
    materials: [__filename],
    model: 'test',
    outDir,
    artifacts: createFileArtifactStore(outDir),
    maxIterations: 2
  });
  const result = await bridge.run();
  assert.strictEqual(result.ok, true);
  assert.ok(fs.existsSync(path.join(outDir, 'final', 'final.md')));
  console.log('ok');
})();
