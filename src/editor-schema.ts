import type {SourceEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {extensionConfig} from './config.js';
import {sourceBinding} from './source-editor.js';
import {jsonValueSchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {parseJsonValue} from './jotai-bridge.js';
const definitions = [{editorId: 'json-value-source', opcodes: ['defineAtom', 'setAtomValue', 'createSetActionJson', 'normalizeValueJson'],
  bindings: [sourceBinding('VALUE', jsonValueSchemaBundle, parseJsonValue)]}];

export const sourceEditorDefinitions: readonly SourceEditorOptions[] = definitions.map(({editorId, opcodes, bindings}) => ({
  apiVersion: 1, extensionId: extensionConfig.id, editorId, opcodes: opcodes.map(opcode => `${extensionConfig.id}_${opcode}`), bindings,
  validationContext: () => ({consumerId: extensionConfig.id, nowMs: Date.now(), settings: null})
}));
