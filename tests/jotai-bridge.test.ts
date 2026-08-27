import {describe, expect, it} from 'vitest';
import {
  applyAction,
  createAtomDefinition,
  createEmptyPlan,
  createSetAtomAction,
  defineAtom,
  getAtomValue,
  parseJsonValue,
  serializePlan
} from '../src/jotai-bridge.js';

describe('Jotai bridge plan', () => {
  it('defines atoms and snapshots default values deterministically', () => {
    const plan = defineAtom(createEmptyPlan(), createAtomDefinition('counter', 0));

    expect(plan.registry.atoms).toEqual([
      {id: 'counter', label: 'counter', defaultValue: 0, writable: true, tags: []}
    ]);
    expect(plan.snapshot.values).toEqual({counter: 0});
    expect(serializePlan(plan)).toContain('"formatVersion": 1');
  });

  it('creates and applies set-atom action envelopes', () => {
    const base = defineAtom(createEmptyPlan(), createAtomDefinition('profile', {name: 'Ada'}));
    const action = createSetAtomAction('profile', {name: 'Grace'});
    const plan = applyAction(base, action);

    expect(action).toEqual({
      formatVersion: 1,
      kind: 'jotai.setAtom',
      atomId: 'profile',
      value: {name: 'Grace'}
    });
    expect(getAtomValue(plan, 'profile')).toEqual({name: 'Grace'});
    expect(plan.actions).toEqual([action]);
  });

  it('parses only JSON-serializable values', () => {
    expect(parseJsonValue('{"items":[1,true,null]}')).toEqual({items: [1, true, null]});
    expect(() => parseJsonValue('undefined')).toThrow();
    expect(() => createAtomDefinition('1-invalid', 0)).toThrow('Atom ID must start with a letter');
  });
});
