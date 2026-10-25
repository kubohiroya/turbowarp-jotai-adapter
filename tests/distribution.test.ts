import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {describe, expect, it} from 'vitest';

describe('published distribution', () => {
  it('loads the standalone classic script and registers all source inputs', async () => {
    const extensions: Array<{getInfo(): {id: string; blocks: unknown[]}; normalizeValueJson(args: {VALUE: string}): string}> = [];
    const definitions: Array<{opcodes: string[]; bindings: Array<{argument: string}>}> = [];
    const Scratch = {
      extensions: {unsandboxed: true, register: (value: typeof extensions[number]) => extensions.push(value)},
      BlockType: {COMMAND: 'command', REPORTER: 'reporter'},
      ArgumentType: {STRING: 'string'},
      Cast: {toString: (value: unknown) => String(value)},
      translate: (message: string | {default: string}) => typeof message === 'string' ? message : message.default,
      gui: {blockEditors: {apiVersion: 1, registerSourceEditor: (definition: typeof definitions[number]) => {
        definitions.push(definition);
        return () => {};
      }}}
    };
    const source = await readFile(new URL('../dist/turbowarp-jotai-adapter.js', import.meta.url), 'utf8');
    runInNewContext(source, {Scratch, URL, TextEncoder, TextDecoder}, {timeout: 1000});
    expect(extensions).toHaveLength(1);
    expect(extensions[0]!.getInfo().id).toBe('kubohiroyajotaiadapter');
    expect(extensions[0]!.getInfo().blocks).toHaveLength(7);
    expect(extensions[0]!.normalizeValueJson({VALUE: '{"n": 1}'})).toBe('{"n":1}');
    expect(definitions.flatMap(definition => definition.opcodes)).toEqual([
      'kubohiroyajotaiadapter_defineAtom', 'kubohiroyajotaiadapter_setAtomValue',
      'kubohiroyajotaiadapter_createSetActionJson', 'kubohiroyajotaiadapter_normalizeValueJson'
    ]);
    expect(definitions.flatMap(definition => definition.bindings.map(binding => binding.argument))).toEqual(['VALUE']);
  });

  it('keeps the library entry usable without a Scratch host', async () => {
    const library = await import('../dist/jotai-bridge.js');
    expect(JSON.parse(library.serializePlan(library.createEmptyPlan()))).toEqual({
      formatVersion: 1, registry: {atoms: []}, snapshot: {values: {}}, actions: []
    });
    const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    expect(metadata.exports['./jotai-bridge'].import).toBe('./dist/jotai-bridge.js');
    expect(metadata.unpkg).toBe('./dist/turbowarp-jotai-adapter.js');
    expect(metadata.jsdelivr).toBe(metadata.unpkg);
  });
});
