import { Pull } from "./utility.js";
/**
 * A `Future` provides a `PromiseLike`-compatible interface on top of `Pullable` operations.
 */
export class Future {
    replay = null;
    pending = [];
    constructor(executor) {
        const settle = (replay) => {
            this.replay = replay;
            for (const channel of this.pending.splice(0)) {
                replay(channel);
            }
        };
        executor(value => settle(channel => channel.resolve(value)), error => settle(channel => channel.reject(error)), reason => settle(channel => channel.halt(reason)));
    }
    static resolve(value) {
        return new Future(resolve => resolve(value));
    }
    static reject(reason) {
        return new Future((resolve, reject) => reject(reason));
    }
    static halt(reason) {
        return new Future((resolve, reject, halt) => halt(reason));
    }
    [Pull](signal, channel) {
        if (this.replay === null) {
            this.pending.push(channel);
        }
        else {
            this.replay(channel);
        }
    }
    /**
     * Return a promise which does not automatically throw if halted.
     */
    continue(halted) {
        return new Promise((resolve, reject) => {
            this[Pull](null, {
                resolve,
                reject,
                halt(reason) {
                    try {
                        resolve(halted?.(reason));
                    }
                    catch (error) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(error);
                    }
                },
            });
        });
    }
    /**
     * `PromiseLike`-compatible `then` method. On `halt` the promise will throw.
     */
    then(resolved, rejected) {
        const promise = new Promise((resolve, reject) => {
            this[Pull](null, {
                resolve,
                reject,
                halt(reason) {
                    reject(new Error(`Future was halted with reason: ${reason}`));
                },
            });
        });
        return promise.then(resolved, rejected);
    }
}
//# sourceMappingURL=future.js.map