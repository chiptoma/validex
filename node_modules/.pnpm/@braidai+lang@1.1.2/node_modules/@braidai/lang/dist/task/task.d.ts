import type { Pullable, Task } from "./utility.js";
import { Future } from "./future.js";
type WithSignal = {
    signal?: AbortSignal;
};
/**
 * Returns a `Future` from a task, beginning the task in the process.
 */
export declare function begin<Result>(task: Pullable<Result>, { signal }?: WithSignal): Future<Result>;
/**
 * Initializes a task, but does not dispatch it. If `Pull` or `then` are not invoked then the task
 * will not be run.
 */
export declare function task<Result>(body: () => Task<Result>, { signal }?: WithSignal): Pullable<Result> & PromiseLike<Result>;
/**
 * Pull a value from a `Pullable` and assert that it resolves synchronously. If it does not resolve
 * then the operation halts and an error is thrown. Otherwise the resolved value is returned.
 */
export declare function expect<Type>(pullable: Pullable<Type>): Type;
export {};
//# sourceMappingURL=task.d.ts.map