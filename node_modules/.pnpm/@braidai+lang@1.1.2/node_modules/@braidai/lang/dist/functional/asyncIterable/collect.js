import { mapAwait } from "@braidai/lang/functional/iterable/mapAwait";
/**
 * Given a vector of async iterables this returns a new async iterable which yields the results of
 * the underlying iterables as they come in.
 */
export function collect(iterables) {
    switch (iterables.length) {
        case 0: return async function* () { }();
        case 1: return iterables[0];
        default: return async function* () {
            let count = iterables.length;
            let deferred;
            const iterators = [];
            const queue = [];
            const accept = async (iterator) => {
                try {
                    const next = await iterator.next();
                    if (next.done) {
                        if (--count === 0) {
                            deferred?.resolve(null);
                        }
                    }
                    else {
                        push(() => {
                            void accept(iterator);
                            return next.value;
                        });
                    }
                }
                catch (error) {
                    push(() => { throw error; });
                }
            };
            const push = (accept) => {
                if (deferred === undefined) {
                    queue.push(accept);
                }
                else {
                    deferred.resolve(accept);
                }
            };
            try {
                // Begin all iterators
                for (const iterable of iterables) {
                    const iterator = iterable[Symbol.asyncIterator]();
                    iterators.push(iterator);
                    void accept(iterator);
                }
                // Delegate to iterables as results complete
                while (true) {
                    while (true) {
                        const next = queue.shift();
                        if (next === undefined) {
                            break;
                        }
                        else {
                            yield next();
                        }
                    }
                    if (count === 0) {
                        break;
                    }
                    else {
                        deferred = Promise.withResolvers();
                        const next = await deferred.promise;
                        if (next === null) {
                            break;
                        }
                        else {
                            deferred = undefined;
                            yield next();
                        }
                    }
                }
            }
            finally {
                // Unwind remaining iterators
                if (count !== 0) {
                    try {
                        await mapAwait(iterators, iterator => iterator.return?.());
                    }
                    catch { }
                }
            }
        }();
    }
}
//# sourceMappingURL=collect.js.map