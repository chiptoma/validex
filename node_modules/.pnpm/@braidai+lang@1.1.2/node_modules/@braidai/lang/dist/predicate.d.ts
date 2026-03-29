import type { Nullable } from "@braidai/lang/types";
/**
 * Strict boolean predicate
 */
export type Predicate<Type, Rest extends unknown[] = []> = (value: Type, ...rest: Rest) => boolean;
export type IndexedPredicate<Type> = Predicate<Type, [index: number]>;
/**
 * Predicate function which attests a given a type
 */
export type PredicateAs<Type, As extends Type, Rest extends unknown[] = []> = (value: Type, ...rest: Rest) => value is As;
export type IndexedPredicateAs<Type, As extends Type> = PredicateAs<Type, As, [index: number]>;
/**
 * Makes a predicate function which checks `instanceof` against a given constructor.
 */
export declare function instanceOfPredicate<Type>(species: abstract new (...args: any[]) => Type): PredicateAs<unknown, Type>;
export declare function invertedPredicate<Type, Rest extends [context?: unknown]>(predicate: Predicate<Type, Rest>): Predicate<Type, Rest>;
export declare function mappedPredicate<Type, Rest extends [context?: unknown], Result>(predicate: Predicate<Result, Rest>, map: (value: Type, ...rest: Rest) => Result): Predicate<Type, Rest>;
/**
 * Predicate which checks for `null` or `undefined` and narrows the type.
 */
export declare function nonNullPredicate<Type>(value: Nullable<Type>): value is Type;
/**
 * Returns a new predicate which expresses if *all* of the given predicates are true.
 */
export declare function everyPredicate<From, Rest extends [context?: unknown], As extends From>(predicates: [
    first: PredicateAs<From, As, Rest>,
    ...rest: Predicate<NoInfer<As>, Rest>[]
]): PredicateAs<From, As, Rest>;
export declare function everyPredicate<Type, Rest extends [context?: unknown]>(predicates: Iterable<Predicate<Type, Rest>>): Predicate<Type, Rest>;
/**
 * Returns a new predicate which expresses if *any* of the given predicates are true.
 */
export declare function somePredicate<From, Rest extends [context?: unknown], To0 extends From, To1 extends From = never, To2 extends From = never>(predicates: [
    predicate1: PredicateAs<From, To0, Rest>,
    predicate2?: PredicateAs<From, To1, Rest>,
    predicate3?: PredicateAs<From, To2, Rest>
]): PredicateAs<From, To0 | To1 | To2, Rest>;
export declare function somePredicate<Type, Rest extends [context?: unknown]>(predicates: Iterable<Predicate<Type, Rest>>): Predicate<Type, Rest>;
//# sourceMappingURL=predicate.d.ts.map