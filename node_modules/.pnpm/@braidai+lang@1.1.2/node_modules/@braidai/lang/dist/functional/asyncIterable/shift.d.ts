interface ShiftAsyncEmpty {
    head: undefined;
    rest: undefined;
}
interface ShiftAsyncResult<Type> {
    head: Type;
    rest: AsyncIterable<Type>;
}
type ShiftedAsync<Type> = ShiftAsyncEmpty | ShiftAsyncResult<Type>;
/**
 * Returns the first element from an iterable, as well as another iterable that will continue after
 * the shifted element.
 */
export declare function shiftAsync<Type>(iterable: AsyncIterable<Type, unknown>): Promise<ShiftedAsync<Type>>;
export {};
//# sourceMappingURL=shift.d.ts.map