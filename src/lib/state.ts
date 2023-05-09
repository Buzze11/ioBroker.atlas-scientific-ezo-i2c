export type StateValue = string | number | boolean | null;
export type StateChangeListener<T extends StateValue> = (oldValue: T, newValue: T) => Promise<void>;
export type ForeignStateChangeListener<T extends StateValue> = (value: T) => Promise<void>;