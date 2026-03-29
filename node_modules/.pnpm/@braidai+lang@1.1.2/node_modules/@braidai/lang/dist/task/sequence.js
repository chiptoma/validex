import { driver } from "./driver.js";
import { Pull, acquire } from "./utility.js";
function finishedNext(receive, signal, channel) {
    channel.reject(new Error("Sequence has terminated"));
}
function runningNext(receive, signal, channel) {
    channel.reject(new Error("Sequence is already running"));
}
/**
 * `sequence` invokes the given body with a single parameter, `produce`. This parameter returns a
 * pullable value which will emit the value from the sequence. You can use `produce` from nested
 * scopes which allows for interesting composition of sequences.
 */
export function sequence(body) {
    const holder = acquire(body);
    return {
        [Pull](signal, iteratorChannel) {
            const body = holder();
            const end = {};
            let next = (receive, initialSignal, initialChannel) => {
                if (initialSignal !== signal) {
                    initialChannel.reject(new Error("Pulled sequence value from another scope"));
                    return;
                }
                next = runningNext;
                let nextChannel = initialChannel;
                // First pull begins the sequence. No need to invoke `receive` here since it will
                // unconditionally resolve.
                driver(signal, {
                    resolve() {
                        next = finishedNext;
                        nextChannel.resolve(end);
                    },
                    reject(error) {
                        next = finishedNext;
                        nextChannel.reject(error);
                    },
                    halt(reason) {
                        next = finishedNext;
                        nextChannel.halt(reason);
                    },
                }, body(value => ({
                    [Pull](yieldSignal, yieldChannel) {
                        next = (receive, nextSignal, channel) => {
                            if (nextSignal !== signal) {
                                channel.reject(new Error("Pulled sequence value from another scope"));
                                return;
                            }
                            next = runningNext;
                            nextChannel = channel;
                            receive(yieldChannel);
                        };
                        nextChannel.resolve(value);
                    },
                })));
            };
            // Resolve the `Pullable<Type>` which is the sequence bound to the current scope.
            iteratorChannel.resolve({
                end,
                [Pull](signal, channel) {
                    next(channel => channel.resolve(), signal, channel);
                },
            });
        },
    };
}
/**
 * Convert an `Iterable` into a `Sequence`.
 */
export function fromIterable(iterable) {
    return sequence(function* (produce) {
        for (const value of iterable) {
            yield produce(value);
        }
    });
}
/**
 * Convert an `AsyncIterable` into a `Sequence`.
 */
export function fromAsyncIterable(iterable) {
    return sequence(function* (produce) {
        const iterator = iterable[Symbol.asyncIterator]();
        try {
            for (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            let cursor = yield iterator.next(); !cursor.done; 
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            cursor = yield iterator.next()) {
                yield produce(cursor.value);
            }
        }
        finally {
            const final = iterator.return?.();
            if (final) {
                yield final;
            }
        }
    });
}
//# sourceMappingURL=sequence.js.map