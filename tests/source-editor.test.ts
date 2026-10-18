import {createBlockEditorService} from '@kubohiroya/turbowarp-extension-data-editor/rjsf';
import type {BlockEditorHost, BlockSnapshot, JsonObject, LiteralArgumentChange} from '@kubohiroya/turbowarp-extension-data-editor';
import {describe, expect, it} from 'vitest';
import {sourceEditorDefinitions} from '../src/editor-schema.js';
import {registerSourceEditors} from '../src/source-editor.js';
const context = {consumerId: 'regression', nowMs: 1, settings: null};
describe('source form contracts', () => {
 it('matches existing owner acceptance without replacing raw values', () => {
const binding = sourceEditorDefinitions[0]!.bindings[0]!;
 for (const source of ['null','false','1','"x"','[1,1,null]','{"unknown":[true,null]}']) {
  expect(binding.validateSource(source, context).result.kind).toBe('valid');
  expect(binding.decode(source).source).toBe(source);
 }
 for (const source of ['', '{', '1e999']) expect(binding.validateSource(source, context).result.kind).toBe('invalid');
 expect(sourceEditorDefinitions.flatMap(d => d.opcodes.map(opcode => opcode.slice(d.extensionId.length + 1)))).toEqual(['defineAtom','setAtomValue','createSetActionJson','normalizeValueJson']);
 });
 it('preserves invalid source for repair and validates the exact source', () => {
  for (const definition of sourceEditorDefinitions) for (const binding of definition.bindings) {
   const source = '{';
   expect(binding.validateSource(source, context).source).toBe(source);
   expect(binding.validateSource(source, context).result.kind).toBe('invalid');
   expect(() => binding.decode(source)).toThrow();
  }
 });
 it('registers only on the optional capability and unregisters once on disposal', () => {
  expect(() => registerSourceEditors({}, sourceEditorDefinitions)()).not.toThrow();
  let staleRegistrations = 0;
  registerSourceEditors({gui: {blockEditors: {apiVersion: 2, registerSourceEditor() {staleRegistrations++; return () => {};}}}}, sourceEditorDefinitions)();
  expect(staleRegistrations).toBe(0);
  let registrations = 0, removals = 0;
  const listeners = new Map<string, () => void>();
  const scratch = {gui: {blockEditors: {apiVersion: 1, registerSourceEditor() {registrations++; return () => {removals++;};}}},
   vm: {runtime: {on(event: string, callback: () => void) {listeners.set(event, callback);}, off(event: string) {listeners.delete(event);}}}};
  const dispose = registerSourceEditors(scratch, sourceEditorDefinitions);
  expect(registrations).toBe(sourceEditorDefinitions.length);
  listeners.get('RUNTIME_DISPOSED')!();
  dispose();
  expect(removals).toBe(registrations);
  expect(listeners.size).toBe(0);
 });
});

describe('prepared source service integration', () => {
 function fixture() {
  const definition = sourceEditorDefinitions[0]!;
  const input: Record<string, string> = {VALUE: '{ "keep":[1,1], "value":1 }'};
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}}, [definition]);
  const reference = {targetId: 'sprite', blockId: 'block'};
  const snapshot: BlockSnapshot = {...reference, opcode: definition.opcodes[0]!, revision: '1',
   arguments: Object.fromEntries(Object.entries(input).map(([argument, value]) => [argument, {kind: 'literal' as const, value}]))};
  const commits: (readonly LiteralArgumentChange[])[] = [];
  const host: BlockEditorHost = {readBlock: () => snapshot, commit: request => {commits.push(request.changes);}};
  return {session: service.registry.open(reference, host)!, commits, input, definition, remove};
 }
 it('registers every target opcode with the actual prepared service', () => {
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}}, sourceEditorDefinitions);
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) {
   expect(service.registry.resolve(opcode)?.editableArguments).toEqual(definition.bindings.map(binding => binding.argument));
  }
  remove();
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) expect(service.registry.resolve(opcode)).toBeUndefined();
  const removeAgain = registerSourceEditors({gui: {blockEditors: service.api}}, sourceEditorDefinitions);
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) expect(service.registry.resolve(opcode)).toBeDefined();
  removeAgain();
 });
 it('keeps exact no-op bytes without an undo transaction', async () => {
  const {session, commits, remove} = fixture();
  expect(await session.save()).toEqual({status: 'saved', changed: false});
  expect(commits).toEqual([]);
  remove();
 });
 it('edits one value without normalizing untouched source and commits once', async () => {
  const {session, commits, input, definition, remove} = fixture();
  const draft = session.getDraft();
  const entries = draft.sources as JsonObject;
  const argument = definition.bindings[0]!.argument;
  const entry = entries[argument] as JsonObject;
  (entry.data as JsonObject).value = 2;
  session.setDraft(draft);
  expect(await session.save()).toEqual({status: 'saved', changed: true});
  expect(commits.length).toBe(1);
  expect(commits[0]!.length).toBe(1);
  const source = commits[0]![0]!.value as string;
  expect(source).toContain('"keep":[1,1]');
  if (definition.bindings.length === 2) {
   expect(source).toContain('"method":" get "');
   expect(commits[0]!.some(change => change.argument === 'AUTH')).toBe(false);
   expect(input.AUTH).toContain('"providers":["github"]');
  }
  remove();
 });
 it('rejects invalid raw source before committing any bound input', async () => {
  const {session, commits, definition, remove} = fixture();
  const draft = session.getDraft();
  const entries = draft.sources as JsonObject;
  entries[definition.bindings[0]!.argument] = {mode: 'source', source: '{'};
  session.setDraft(draft);
  expect((await session.save()).status).toBe('invalid');
  expect(commits).toEqual([]);
  remove();
 });
});
