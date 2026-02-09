#!/usr/bin/env node

const path = require('path');
const { ResponderBridge, createFlowmarkToolAdapter } = require('../src');
const { OpenAIProvider } = require('@hak2i/responder-bridge-openai');
const { createMaterialsLoader, createFileArtifactStore } = require('../src');

function printHelp() {
  const msg = `responder-bridge (v0.1.0)

Usage:
  responder-bridge run --tool flowmark --describe "ai --lang en" --params "normalize --lang en" --materials README.md tools.md --model gpt-5.2 --out artifacts/run-001

Options:
  --tool         Tool name (flowmark)
  --describe     Describe args (default: "ai --lang en")
  --params       Params args (optional)
  --materials    Comma-separated file paths
  --model        Model name
  --out          Output directory
  --max-iter     Max iterations (default: 3)
  --help         Show help
`;
  process.stdout.write(msg);
}

function parseArgs(argv) {
  const opts = {
    tool: 'flowmark',
    describe: 'ai --lang en',
    params: null,
    materials: [],
    model: null,
    out: null,
    maxIter: 3
  };
  let command = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--tool') {
      opts.tool = argv[++i] || opts.tool;
    } else if (arg === '--describe') {
      opts.describe = argv[++i] || opts.describe;
    } else if (arg === '--params') {
      opts.params = argv[++i] || null;
    } else if (arg === '--materials') {
      const list = argv[++i] || '';
      opts.materials = list.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--model') {
      opts.model = argv[++i] || null;
    } else if (arg === '--out') {
      opts.out = argv[++i] || null;
    } else if (arg === '--max-iter') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isNaN(v)) opts.maxIter = v;
    } else if (!command) {
      command = arg;
    }
  }

  return { command, opts };
}

function parseDescribe(arg) {
  const parts = arg.split(' ');
  const topic = parts[0];
  const langIndex = parts.indexOf('--lang');
  const lang = langIndex >= 0 ? parts[langIndex + 1] : 'en';
  return { topic, lang };
}

function parseParams(arg) {
  if (!arg) return null;
  const parts = arg.split(' ');
  const topic = parts[0];
  const langIndex = parts.indexOf('--lang');
  const lang = langIndex >= 0 ? parts[langIndex + 1] : 'en';
  return { topic, lang };
}

async function run(opts) {
  if (!opts.model) {
    process.stderr.write('Missing --model\n');
    process.exit(2);
  }
  if (!opts.out) {
    process.stderr.write('Missing --out\n');
    process.exit(2);
  }
  if (opts.materials.length === 0) {
    process.stderr.write('Missing --materials\n');
    process.exit(2);
  }

  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
    timeoutMs: 30000,
    retries: 2
  });

  const tool = createFlowmarkToolAdapter('flowmark');
  const describe = parseDescribe(opts.describe);
  const params = parseParams(opts.params);

  const bridge = new ResponderBridge({
    provider,
    tool,
    materials: opts.materials,
    model: opts.model,
    outDir: opts.out,
    maxIterations: opts.maxIter,
    describeTopic: describe.topic,
    paramsTopic: params ? params.topic : null,
    lang: describe.lang,
    materialsLoader: createMaterialsLoader(),
    artifacts: createFileArtifactStore(opts.out)
  });

  const result = await bridge.run();
  if (!result.ok) process.exit(1);
}

async function main() {
  const { command, opts } = parseArgs(process.argv.slice(2));
  if (opts.help || !command) {
    printHelp();
    process.exit(opts.help ? 0 : 2);
  }
  if (command !== 'run') {
    printHelp();
    process.exit(2);
  }
  await run(opts);
}

main().catch((err) => {
  process.stderr.write(String(err.stack || err) + '\n');
  process.exit(2);
});
