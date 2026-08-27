export const JOTAI_BRIDGE_FORMAT_VERSION = 1 as const;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | {[key: string]: JsonValue};

export interface AtomDefinition {
  id: string;
  label: string;
  defaultValue: JsonValue;
  writable: boolean;
  tags: readonly string[];
}

export interface AtomRegistry {
  atoms: readonly AtomDefinition[];
}

export interface AtomStateSnapshot {
  values: Record<string, JsonValue>;
}

export interface SetAtomActionEnvelope extends Record<string, JsonValue> {
  formatVersion: typeof JOTAI_BRIDGE_FORMAT_VERSION;
  kind: 'jotai.setAtom';
  atomId: string;
  value: JsonValue;
}

export type AtomActionEnvelope = SetAtomActionEnvelope;

export interface AtomBridgePlan {
  formatVersion: typeof JOTAI_BRIDGE_FORMAT_VERSION;
  registry: AtomRegistry;
  snapshot: AtomStateSnapshot;
  actions: readonly AtomActionEnvelope[];
}

export function createEmptyPlan(): AtomBridgePlan {
  return {
    formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
    registry: {atoms: []},
    snapshot: {values: {}},
    actions: []
  };
}

export function createAtomDefinition(
  id: string,
  defaultValue: JsonValue,
  options: Partial<Pick<AtomDefinition, 'label' | 'writable' | 'tags'>> = {}
): AtomDefinition {
  const atomId = normalizeAtomId(id);
  return {
    id: atomId,
    label: options.label ?? atomId,
    defaultValue,
    writable: options.writable ?? true,
    tags: [...(options.tags ?? [])].sort()
  };
}

export function createSetAtomAction(atomId: string, value: JsonValue): SetAtomActionEnvelope {
  return {
    formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
    kind: 'jotai.setAtom',
    atomId: normalizeAtomId(atomId),
    value
  };
}

export function defineAtom(plan: AtomBridgePlan, atom: AtomDefinition): AtomBridgePlan {
  const atoms = new Map(plan.registry.atoms.map((current) => [current.id, current]));
  atoms.set(atom.id, atom);
  const values = {...plan.snapshot.values};
  values[atom.id] = atom.defaultValue;

  return normalizePlan({
    ...plan,
    registry: {atoms: [...atoms.values()]},
    snapshot: {values}
  });
}

export function applyAction(plan: AtomBridgePlan, action: AtomActionEnvelope): AtomBridgePlan {
  const atom = plan.registry.atoms.find((definition) => definition.id === action.atomId);
  const nextPlan = atom === undefined ? defineAtom(plan, createAtomDefinition(action.atomId, null)) : plan;
  const values = {...nextPlan.snapshot.values, [action.atomId]: action.value};

  return normalizePlan({
    ...nextPlan,
    snapshot: {values},
    actions: [...nextPlan.actions, action]
  });
}

export function getAtomValue(plan: AtomBridgePlan, atomId: string): JsonValue {
  const id = normalizeAtomId(atomId);
  if (Object.prototype.hasOwnProperty.call(plan.snapshot.values, id)) {
    return plan.snapshot.values[id] ?? null;
  }
  return null;
}

export function parseJsonValue(source: string): JsonValue {
  const parsed = JSON.parse(source) as unknown;
  return requireJsonValue(parsed);
}

export function serializeJsonValue(value: JsonValue): string {
  return JSON.stringify(value);
}

export function serializePlan(plan: AtomBridgePlan): string {
  return `${JSON.stringify(normalizePlan(plan), null, 2)}\n`;
}

export function normalizeAtomId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(id)) {
    throw new TypeError(
      'Atom ID must start with a letter and contain only letters, numbers, "_", ".", ":", or "-".'
    );
  }
  return id;
}

function normalizePlan(plan: AtomBridgePlan): AtomBridgePlan {
  const atoms = [...plan.registry.atoms].sort((left, right) => compareIds(left.id, right.id));
  const knownAtomIds = new Set(atoms.map((atom) => atom.id));
  const values = Object.fromEntries(
    Object.entries(plan.snapshot.values)
      .filter(([id]) => knownAtomIds.has(id))
      .sort(([left], [right]) => compareIds(left, right))
  ) as Record<string, JsonValue>;

  return {
    formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
    registry: {atoms},
    snapshot: {values},
    actions: [...plan.actions]
  };
}

function requireJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(requireJsonValue);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        requireJsonValue(item)
      ])
    );
  }
  throw new TypeError('Value must be JSON serializable.');
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
