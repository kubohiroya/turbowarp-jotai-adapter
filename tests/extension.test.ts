import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {JotaiBridgeExtension} from '../src/extension.js';

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter'},
    ArgumentType: {STRING: 'string'},
    Cast: {
      toString: (value: unknown) => String(value)
    },
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    extensions: {unsandboxed: false, register: vi.fn()}
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('JotaiBridgeExtension', () => {
  it('publishes block metadata', () => {
    const info = new JotaiBridgeExtension().getInfo() as {
      name: string;
      docsURI: string;
      blocks: Array<{opcode: string; blockType: string}>;
    };

    expect(info.name).toBe('TurboWarp Jotai Adapter');
    expect(info.docsURI).toBe('https://kubohiroya.github.io/turbowarp-jotai-adapter/');
    expect(info.blocks.map((block) => block.opcode)).toContain('planJson');
  });

  it('builds bridge JSON through TurboWarp-facing methods', () => {
    const extension = new JotaiBridgeExtension();

    extension.defineAtom({ATOM: 'counter', VALUE: '0'});
    extension.setAtomValue({ATOM: 'counter', VALUE: '2'});

    expect(extension.atomValueJson({ATOM: 'counter'})).toBe('2');
    expect(JSON.parse(extension.createSetActionJson({ATOM: 'counter', VALUE: '3'}))).toEqual({
      formatVersion: 1,
      kind: 'jotai.setAtom',
      atomId: 'counter',
      value: 3
    });
    expect(JSON.parse(extension.planJson())).toMatchObject({
      formatVersion: 1,
      snapshot: {values: {counter: 2}},
      actions: [{kind: 'jotai.setAtom', atomId: 'counter', value: 2}]
    });
  });
});
