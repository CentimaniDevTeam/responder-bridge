const path = require('path');
const fs = require('fs');
const { createMaterialsLoader } = require('./materials');
const { createFileArtifactStore } = require('./artifacts');

function nowIso() {
  return new Date().toISOString();
}

function composePrompt({ describeText, paramsText, materialsText }) {
  const systemParts = [];
  systemParts.push('You are a Responder generating a FlowMark document.');
  if (describeText) systemParts.push('Describe:\n' + describeText);
  if (paramsText) systemParts.push('Params:\n' + paramsText);
  const system = systemParts.join('\n\n');
  const user = `Materials:\n${materialsText}\n\nGenerate a FlowMark document. Do not summarize or omit enumerations.`;
  return {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  };
}

function composeFixPrompt({ describeText, paramsText, materialsText, draft, validationLog }) {
  const systemParts = [];
  systemParts.push('You are a Responder fixing a FlowMark document to pass validation.');
  if (describeText) systemParts.push('Describe:\n' + describeText);
  if (paramsText) systemParts.push('Params:\n' + paramsText);
  const system = systemParts.join('\n\n');
  const user = `Materials:\n${materialsText}\n\nPrevious Draft:\n${draft}\n\nValidation Log:\n${validationLog}\n\nFix to pass validator. Do not reduce enumeration.`;
  return {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  };
}

class ResponderBridge {
  constructor(opts) {
    this.provider = opts.provider;
    this.tool = opts.tool;
    this.materials = opts.materials || [];
    this.model = opts.model;
    this.outDir = opts.outDir;
    this.maxIterations = opts.maxIterations || 3;
    this.temperature = opts.temperature;
    this.describeTopic = opts.describeTopic || 'ai';
    this.paramsTopic = opts.paramsTopic || null;
    this.lang = opts.lang || 'en';
    this.materialsLoader = opts.materialsLoader || createMaterialsLoader();
    this.artifacts = opts.artifacts || createFileArtifactStore(this.outDir);
  }

  async run() {
    await this.artifacts.init();
    const describeText = await this.tool.describe(this.describeTopic, { lang: this.lang });
    await this.artifacts.writeInput('describe.md', describeText);

    let paramsText = null;
    if (this.tool.params && this.paramsTopic) {
      paramsText = await this.tool.params(this.paramsTopic, { lang: this.lang });
      if (paramsText) await this.artifacts.writeInput('params.md', paramsText);
    }

    const materialsText = await this.materialsLoader.load(this.materials);
    await this.artifacts.writeInput('materials.txt', materialsText);

    let draft = '';
    let ok = false;
    let validationLog = '';
    let iteration = 0;

    for (iteration = 1; iteration <= this.maxIterations; iteration++) {
      const prompt = iteration === 1
        ? composePrompt({ describeText, paramsText, materialsText })
        : composeFixPrompt({ describeText, paramsText, materialsText, draft, validationLog });

      const resp = await this.provider.generate({
        model: this.model,
        messages: prompt.messages,
        temperature: this.temperature
      });

      draft = resp.text;
      const draftPath = path.join(this.outDir, 'draft.md');
      fs.writeFileSync(draftPath, draft, 'utf8');

      const validation = await this.tool.validate(draftPath, { lang: this.lang });
      ok = validation.ok;
      validationLog = validation.logText || '';

      await this.artifacts.writeIteration(iteration, {
        'prompt.json': JSON.stringify(prompt, null, 2) + '\n',
        'draft.md': draft,
        'validation.log': validationLog
      });

      if (ok) {
        break;
      }
    }

    if (ok) {
      await this.artifacts.writeFinal({
        'final.md': draft,
        'validation.log': validationLog
      });
    }

    await this.artifacts.writeMeta({
      provider: this.provider.constructor ? this.provider.constructor.name : 'provider',
      model: this.model,
      describeTopic: this.describeTopic,
      paramsTopic: this.paramsTopic,
      lang: this.lang,
      maxIterations: this.maxIterations,
      iterations: iteration,
      ok,
      started_at: nowIso(),
      finished_at: nowIso()
    });

    return { ok, iterations: iteration, outputPath: this.outDir };
  }
}

module.exports = { ResponderBridge };
