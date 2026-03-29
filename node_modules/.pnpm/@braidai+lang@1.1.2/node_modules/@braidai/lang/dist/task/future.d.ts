import type { Pullable, PullableChannel } from "./utility.js";
import { Pull } from "./utility.js";
/**
 * A `Future` provides a `PromiseLike`-compatible interface on top of `Pullable` operations.
 */
export declare class Future<Type> implements Pullable<Type>, PromiseLike<Type> {
    private replay;
    private readonly pending;
    constructor(executor: (resolve: PullableChannel<Type>["resolve"], reject: PullableChannel<Type>["reject"], abort: PullableChannel<Type>["halt"]) => void);
    static resolve<Type>(value: Type): Future<Type>;
    static reject(reason: Error): Future<never>;
    static halt(reason?: any): Future<never>;
    [Pull](signal: unknown, channel: PullableChannel<Type>): void;
    /**
     * Return a promise which does not automatically throw if halted.
     */
    continue<Next = never>(halted?: (reason: unknown) => Next): Promise<Type | Next>;
    /**
     * `PromiseLike`-compatible `then` method. On `halt` the promise will throw.
     */
    then<Resolved = Type, Rejected = never>(resolved: ((value: Type) => PromiseLike<Resolved> | Resolved) | null | undefined, rejected?: ((reason: any) => PromiseLike<Rejected> | Rejected) | null): Promise<Resolved | Rejected>;
}
//# sourceMappingURL=future.d.ts.map