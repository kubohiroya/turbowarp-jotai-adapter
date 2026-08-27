export declare const JOTAI_BRIDGE_FORMAT_VERSION: 1;
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | {
    [key: string]: JsonValue;
};
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
export declare function createEmptyPlan(): AtomBridgePlan;
export declare function createAtomDefinition(id: string, defaultValue: JsonValue, options?: Partial<Pick<AtomDefinition, 'label' | 'writable' | 'tags'>>): AtomDefinition;
export declare function createSetAtomAction(atomId: string, value: JsonValue): SetAtomActionEnvelope;
export declare function defineAtom(plan: AtomBridgePlan, atom: AtomDefinition): AtomBridgePlan;
export declare function applyAction(plan: AtomBridgePlan, action: AtomActionEnvelope): AtomBridgePlan;
export declare function getAtomValue(plan: AtomBridgePlan, atomId: string): JsonValue;
export declare function parseJsonValue(source: string): JsonValue;
export declare function serializeJsonValue(value: JsonValue): string;
export declare function serializePlan(plan: AtomBridgePlan): string;
export declare function normalizeAtomId(value: string): string;
