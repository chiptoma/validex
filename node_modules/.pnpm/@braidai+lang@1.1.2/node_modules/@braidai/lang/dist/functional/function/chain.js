export function chain(prev, next, combine) {
    return prev
        ? next
            ? combine(prev, next)
            : prev
        : next;
}
export function chainSequenceInto(prev, next) {
    return (arg) => next(prev(arg));
}
export function chainSequenceVoid0(prev, next) {
    return () => {
        next();
        prev();
    };
}
export function chainSequenceVoid1(prev, next) {
    return (arg) => {
        next(arg);
        prev(arg);
    };
}
//# sourceMappingURL=chain.js.map