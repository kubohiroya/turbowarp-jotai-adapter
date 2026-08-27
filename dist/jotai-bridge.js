export const JOTAI_BRIDGE_FORMAT_VERSION = 1;
export function createEmptyPlan() {
    return {
        formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
        registry: { atoms: [] },
        snapshot: { values: {} },
        actions: []
    };
}
export function createAtomDefinition(id, defaultValue, options = {}) {
    const atomId = normalizeAtomId(id);
    return {
        id: atomId,
        label: options.label ?? atomId,
        defaultValue,
        writable: options.writable ?? true,
        tags: [...(options.tags ?? [])].sort()
    };
}
export function createSetAtomAction(atomId, value) {
    return {
        formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
        kind: 'jotai.setAtom',
        atomId: normalizeAtomId(atomId),
        value
    };
}
export function defineAtom(plan, atom) {
    const atoms = new Map(plan.registry.atoms.map((current) => [current.id, current]));
    atoms.set(atom.id, atom);
    const values = { ...plan.snapshot.values };
    values[atom.id] = atom.defaultValue;
    return normalizePlan({
        ...plan,
        registry: { atoms: [...atoms.values()] },
        snapshot: { values }
    });
}
export function applyAction(plan, action) {
    const atom = plan.registry.atoms.find((definition) => definition.id === action.atomId);
    const nextPlan = atom === undefined ? defineAtom(plan, createAtomDefinition(action.atomId, null)) : plan;
    const values = { ...nextPlan.snapshot.values, [action.atomId]: action.value };
    return normalizePlan({
        ...nextPlan,
        snapshot: { values },
        actions: [...nextPlan.actions, action]
    });
}
export function getAtomValue(plan, atomId) {
    const id = normalizeAtomId(atomId);
    if (Object.prototype.hasOwnProperty.call(plan.snapshot.values, id)) {
        return plan.snapshot.values[id] ?? null;
    }
    return null;
}
export function parseJsonValue(source) {
    const parsed = JSON.parse(source);
    return requireJsonValue(parsed);
}
export function serializeJsonValue(value) {
    return JSON.stringify(value);
}
export function serializePlan(plan) {
    return `${JSON.stringify(normalizePlan(plan), null, 2)}\n`;
}
export function normalizeAtomId(value) {
    const id = value.trim();
    if (!/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(id)) {
        throw new TypeError('Atom ID must start with a letter and contain only letters, numbers, "_", ".", ":", or "-".');
    }
    return id;
}
function normalizePlan(plan) {
    const atoms = [...plan.registry.atoms].sort((left, right) => compareIds(left.id, right.id));
    const knownAtomIds = new Set(atoms.map((atom) => atom.id));
    const values = Object.fromEntries(Object.entries(plan.snapshot.values)
        .filter(([id]) => knownAtomIds.has(id))
        .sort(([left], [right]) => compareIds(left, right)));
    return {
        formatVersion: JOTAI_BRIDGE_FORMAT_VERSION,
        registry: { atoms },
        snapshot: { values },
        actions: [...plan.actions]
    };
}
function requireJsonValue(value) {
    if (value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(requireJsonValue);
    }
    if (typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [
            key,
            requireJsonValue(item)
        ]));
    }
    throw new TypeError('Value must be JSON serializable.');
}
function compareIds(left, right) {
    if (left < right)
        return -1;
    if (left > right)
        return 1;
    return 0;
}
//# sourceMappingURL=jotai-bridge.js.map