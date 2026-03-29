import type { Nullable } from "@braidai/lang/types";
type AnyFn = (...args: any[]) => any;
type Combinator<Prev extends AnyFn, Next extends AnyFn> = (prev: Prev, next: Next) => (...args: Parameters<Prev & Next>) => ReturnType<Prev & Next>;
/**
 * Utility which can be used as a reducer against an iterable of nullable functions.
 *
 * You're better off using the `fold` technique like `compositeComparator` for iterables which do
 * not contain nullable functions. Otherwise this is handy.
 */
export declare function chain<Prev extends AnyFn, Next extends AnyFn>(prev: Nullable<Prev>, next: Next, combine: Combinator<Prev, Next>): Prev | Next;
export declare function chain<Prev extends AnyFn, Next extends AnyFn>(prev: Prev, next: Nullable<Next>, combine: Combinator<Prev, Next>): Prev | Next;
export declare function chain<Prev extends AnyFn, Next extends AnyFn>(prev: Prev | null, next: Next | null, combine: Combinator<Prev, Next>): Prev | Next | null;
export declare function chain<Prev extends AnyFn, Next extends AnyFn>(prev: Prev | undefined, next: Next | undefined, combine: Combinator<Prev, Next>): Prev | Next | undefined;
export declare function chain<Prev extends AnyFn, Next extends AnyFn>(prev: Nullable<Prev>, next: Nullable<Next>, combine: Combinator<Prev, Next>): Nullable<Prev | Next>;
export declare function chainSequenceInto<Arg>(prev: (arg: Arg) => Arg, next: (arg: Arg) => Arg): (arg: Arg) => Arg;
export declare function chainSequenceVoid0(prev: () => void, next: () => void): () => void;
export declare function chainSequenceVoid1<Arg>(prev: (arg: Arg) => void, next: (arg: Arg) => void): (arg: Arg) => void;
export {};
//# sourceMappingURL=chain.d.ts.map