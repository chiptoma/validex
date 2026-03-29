import type { Operation, Pullable, PullableChannel } from "./utility.js";
import { Pull } from "./utility.js";
/**
 * Holder for a produced value in a sequence. At runtime this is indistinguishable from a regular
 * pullable, but extra type information is added to help with type inference.
 */
export interface Produced<Type> extends Pullable<unknown> {
    [Pull]: (signal: AbortSignal, channel: PullableChannel<unknown>) => void;
    value: Type;
}
/** This is the type of the `produce` function which is passed to `sequence` bodies */
type Produce = <Value>(value: Value) => Produced<Value>;
/** Body of a `sequence` invocation */
type SequenceBody<Type> = (produce: Produce) => Generator<Produced<Type> | Operation, unknown>;
/**
 * A `Sequence` is a pullable which produces a `Cursor`. The produced cursor can be repeatably
 * pulled to produce new values from the sequence. When the sequence is done the cursor will produce
 * `cursor.end`.
 */
export type Sequence<Type> = Pullable<Cursor<Type>>;
export type Cursor<Type> = Pullable<Type> & Record<"end", unknown>;
/**
 * `sequence` invokes the given body with a single parameter, `produce`. This parameter returns a
 * pullable value which will emit the value from the sequence. You can use `produce` from nested
 * scopes which allows for interesting composition of sequences.
 */
export declare function sequence<Type>(body: SequenceBody<Type>): Sequence<Type>;
/**
 * Convert an `Iterable` into a `Sequence`.
 */
export declare function fromIterable<Type>(iterable: Iterable<Type>): Sequence<Type>;
/**
 * Convert an `AsyncIterable` into a `Sequence`.
 */
export declare function fromAsyncIterable<Type>(iterable: AsyncIterable<Type, unknown, unknown>): Sequence<Type>;
export {};
//# sourceMappingURL=sequence.d.ts.map