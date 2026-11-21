import {createProcessingError} from './errorTaxonomy';
import type {PdfEngine, ProcessingError} from './types';

export class EngineRegistry {
  private readonly engines: Map<string, PdfEngine> = new Map();

  public registerEngine(engine: PdfEngine): void {
    this.engines.set(engine.id, engine);
  }

  public unregisterEngine(engineId: string): void {
    this.engines.delete(engineId);
  }

  public getEngineById(engineId: string): PdfEngine | undefined {
    return this.engines.get(engineId);
  }

  public getEngineForTool(toolId: string): PdfEngine | undefined {
    for (const engine of this.engines.values()) {
      if (engine.supportedToolIds.includes(toolId)) {
        return engine;
      }
    }
    return undefined;
  }

  public resolveEngineForTool(
    toolId: string
  ): {engine: PdfEngine; error?: undefined} | {engine?: undefined; error: ProcessingError} {
    const engine = this.getEngineForTool(toolId);
    if (!engine) {
      return {
        error: createProcessingError(
          'ENGINE_NOT_FOUND',
          `No engine registered for toolId="${toolId}".`
        ),
      };
    }
    return {engine};
  }

  public listRegisteredEngines(): PdfEngine[] {
    return Array.from(this.engines.values());
  }

  public clear(): void {
    this.engines.clear();
  }
}

export const defaultEngineRegistry = new EngineRegistry();

export function registerEngine(engine: PdfEngine): void {
  defaultEngineRegistry.registerEngine(engine);
}

export function getEngineForTool(toolId: string): PdfEngine | undefined {
  return defaultEngineRegistry.getEngineForTool(toolId);
}
