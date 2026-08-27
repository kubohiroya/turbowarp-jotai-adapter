import {extensionConfig} from './config';
import definitions from './block-definitions.json';
import {
  applyAction,
  createAtomDefinition,
  createEmptyPlan,
  createSetAtomAction,
  defineAtom as defineAtomInPlan,
  getAtomValue,
  parseJsonValue,
  serializeJsonValue,
  serializePlan,
  type AtomBridgePlan
} from './jotai-bridge';

type BlockTypeName = 'COMMAND' | 'REPORTER';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];

export class JotaiBridgeExtension implements TurboWarpExtension {
  private plan: AtomBridgePlan = createEmptyPlan();

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
    };
  }

  public defineAtom(args: {ATOM: unknown; VALUE: unknown}): void {
    const atomId = Scratch.Cast.toString(args.ATOM);
    const value = this.parseBlockJson(args.VALUE);
    this.plan = defineAtomInPlan(this.plan, createAtomDefinition(atomId, value));
  }

  public setAtomValue(args: {ATOM: unknown; VALUE: unknown}): void {
    const action = createSetAtomAction(
      Scratch.Cast.toString(args.ATOM),
      this.parseBlockJson(args.VALUE)
    );
    this.plan = applyAction(this.plan, action);
  }

  public atomValueJson(args: {ATOM: unknown}): string {
    return serializeJsonValue(getAtomValue(this.plan, Scratch.Cast.toString(args.ATOM)));
  }

  public createSetActionJson(args: {ATOM: unknown; VALUE: unknown}): string {
    return serializeJsonValue(
      createSetAtomAction(Scratch.Cast.toString(args.ATOM), this.parseBlockJson(args.VALUE))
    );
  }

  public planJson(): string {
    return serializePlan(this.plan);
  }

  public clearPlan(): void {
    this.plan = createEmptyPlan();
  }

  public normalizeValueJson(args: {VALUE: unknown}): string {
    return serializeJsonValue(this.parseBlockJson(args.VALUE));
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [
          name,
          {
            type: Scratch.ArgumentType[argument.type],
            defaultValue: argument.defaultValue
          }
        ])
      )
    };
  }

  private parseBlockJson(value: unknown) {
    return parseJsonValue(Scratch.Cast.toString(value));
  }
}
