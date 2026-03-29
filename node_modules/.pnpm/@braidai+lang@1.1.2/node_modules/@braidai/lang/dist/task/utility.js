export const Pull = Symbol.for("Task.Pull");
/**
 * Convenience function which stashes a value and then ensures it can only be returned once. Used to
 * prevent double-pulling certain one-shot values.
 * @internal
 */
export function acquire(value) {
    let initial = value;
    return () => {
        if (initial === Never) {
            throw new Error("Value was acquired more than once");
        }
        const result = initial;
        initial = Never;
        return result;
    };
}
const Never = Symbol("Never");
/**
 * `accept` is a helper to unwrap type information for the yielded value. This trick is used to pass
 * type information along since TypeScript doesn't have the ability to dynamically specify the type
 * of a yield. You do not need to use `accept` unless you care about the return value of the
 * promise. If you just want to yield for side-effects and exceptions, a simple `yield promise` is
 * enough.
 * https://github.com/microsoft/TypeScript/issues/32523
 */
export function* accept(value) {
    const result = (yield value);
    return result;
}
//# sourceMappingURL=utility.js.map