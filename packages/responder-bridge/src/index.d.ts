export interface Provider {
  generate(input: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
  }): Promise<{ text: string }>;
}

export interface ToolAdapter {
  describe(topic: string, options?: { lang?: string }): Promise<string>;
  params?(topic: string, options?: { lang?: string }): Promise<string | null>;
  validate(filePath: string, options?: { lang?: string }): Promise<{ ok: boolean; logText: string }>;
}

export interface MaterialsLoader {
  load(paths: string[]): Promise<string>;
}

export interface ArtifactStore {
  init(): Promise<void>;
  writeInput(name: string, content: string): Promise<void>;
  writeIteration(iteration: number, files: Record<string, string>): Promise<void>;
  writeFinal(files: Record<string, string>): Promise<void>;
  writeMeta(meta: Record<string, unknown>): Promise<void>;
}

export interface ResponderBridgeOptions {
  provider: Provider;
  tool: ToolAdapter;
  materials: string[];
  model: string;
  outDir: string;
  maxIterations?: number;
  temperature?: number;
  describeTopic?: string;
  paramsTopic?: string;
  lang?: string;
}

export class ResponderBridge {
  constructor(opts: ResponderBridgeOptions);
  run(): Promise<{ ok: boolean; iterations: number; outputPath: string }>;
}

export function createMaterialsLoader(): MaterialsLoader;
export function createFileArtifactStore(outDir: string): ArtifactStore;
export function createFlowmarkToolAdapter(cmd?: string): ToolAdapter;
