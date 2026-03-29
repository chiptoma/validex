import { fold } from "@braidai/lang/functional/iterable/fold/fold";
/**
 * Makes a predicate function which checks `instanceof` against a given constructor.
 */
export function instanceOfPredicate(species) {
    return (value) => value instanceof species;
}
export function invertedPredicate(predicate) {
    // @ts-expect-error -- Potential invoker arity mismatch
    return (value, context) => !predicate(value, context);
}
export function mappedPredicate(predicate, map) {
    // @ts-expect-error -- Potential invoker arity mismatch
    return (value, context) => predicate(map(value, context), context);
}
/**
 * Predicate which checks for `null` or `undefined` and narrows the type.
 */
export function nonNullPredicate(value) {
    return value != null;
}
export function everyPredicate(predicates) {
    return fold(predicates, () => true, (predicate, next) => (value, context) => predicate(value, context) && next(value, context));
}
export function somePredicate(predicates) {
    return fold(predicates, () => true, (predicate, next) => (value, context) => predicate(value, context) || next(value, context));
}
//# sourceMappingURL=predicate.js.map