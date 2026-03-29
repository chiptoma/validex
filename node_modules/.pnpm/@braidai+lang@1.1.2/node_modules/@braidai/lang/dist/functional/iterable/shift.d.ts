interface ShiftEmpty {
    head: undefined;
    rest: undefined;
}
interface ShiftResult<Type> {
    head: Type;
    rest: Iterable<Type>;
}
type Shifted<Type> = ShiftEmpty | ShiftResult<Type>;
/**
 * Returns the first element from an iterable, as well as another iterable that will continue after
 * the shifted element.
 */
export declare function shift<Type>(iterable: Iterable<Type, unknown>): Shifted<Type>;
export {};
//# sourceMappingURL=shift.d.ts.map