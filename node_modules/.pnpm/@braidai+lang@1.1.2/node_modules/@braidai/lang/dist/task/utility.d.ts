export declare const Pull: unique symbol;
/**
 * This is a generator function which yields individual operations and eventually returns a result.
 */
export type Task<Type> = Generator<Operation | null | undefined | void, Type>;
/** Any value which can be yielded to return a response. */
export type Operation<Type = unknown> = Pullable<Type> | PromisePullable<Type>;
/** Any task-native yieldable value */
export interface Pullable<Type> {
    [Pull]: (signal: AbortSignal, channel: PullableChannel<Type>) => void;
    then?: PromiseLike<Type>["then"];
}
/** [Pull] added to internal `Promise` types to simplify implementation */
interface PromisePullable<Type> extends PromiseLike<Type> {
    [Pull]?: never;
}
/**
 * Resolution channel for a pulled value.
 */
export interface PullableChannel<Type> {
    resolve: (value: Type) => void;
    reject: (reason?: unknown) => void;
    halt: (reason?: any) => void;
}
/**
 * `accept` is a helper to unwrap type information for the yielded value. This trick is used to pass
 * type information along since TypeScript doesn't have the ability to dynamically specify the type
 * of a yield. You do not need to use `accept` unless you care about the return value of the
 * promise. If you just want to yield for side-effects and exceptions, a simple `yield promise` is
 * enough.
 * https://github.com/microsoft/TypeScript/issues/32523
 */
export declare function accept<Type>(value: Operation<Type>): Generator<Operation, Type>;
export {};
//# sourceMappingURL=utility.d.ts.map