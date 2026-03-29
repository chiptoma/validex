import { Pull } from "./utility.js";
/**
 * Adapter which pulls a value from a `Pullable` or a `PromiseLike`.
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
function pull(pullable, signal, channel) {
    if (signal.aborted) {
        channel.halt(signal.reason);
        return;
    }
    if (pullable !== null && typeof pullable === "object") {
        if (Pull in pullable) {
            pullable[Pull](signal, channel);
            return;
        }
        else if (typeof pullable.then === "function") {
            // Listen for abort signal since we can't rely on promises to do this.
            const forwardAbort = () => {
                send = () => { };
                channel.halt(signal.reason);
            };
            signal.addEventListener("abort", forwardAbort);
            let send = (receive) => {
                signal.removeEventListener("abort", forwardAbort);
                receive(channel);
            };
            // Forward promise value
            pullable.then(value => send(channel => channel.resolve(value)), (error) => send(channel => channel.reject(error)));
            return;
        }
    }
    else if (pullable === undefined) {
        // Immediately resolve undefined value
        channel.resolve(undefined);
        return;
    }
    channel.reject(new Error("Yielded value is not pullable"));
}
/**
 * When a task is halted, `driver` will "return" an instance of `HaltHolder`. Then, on the other
 * side of the iterable, we can detect a halt with an `instanceof` check.
 */
class HaltHolder {
    reason;
    constructor(reason) {
        this.reason = reason;
    }
}
/** Detect a possible return of `HaltHolder` and either `resolve` or `halt` accordingly */
function resolveMaybeHalt(channel, value) {
    if (value instanceof HaltHolder) {
        channel.halt(value.reason);
    }
    else {
        channel.resolve(value);
    }
}
/**
 * This encapsulates most of the esoteric preemption behavior. It will step through a `Task`,
 * continuously pulling any yielded operations and push a result to the channel when it is done.
 * @internal
 */
export function driver(signal, channel, task) {
    // Special case when we're passed an already aborted signal. The task begins buts halts at the
    // first yield.
    if (signal.aborted) {
        try {
            if (!task.next().done) {
                task.return(undefined);
            }
            channel.halt(signal.reason);
        }
        catch (error) {
            channel.reject(error);
        }
        return;
    }
    // Chain new `AbortController` to parent signal
    const abortController = new AbortController();
    const forwardAbort = () => {
        abortController.abort(signal.reason);
    };
    signal.addEventListener("abort", forwardAbort);
    const cleanup = () => {
        signal.removeEventListener("abort", forwardAbort);
        abortController.abort("Terminated");
    };
    // `resumeDriver` is invoked when an asynchronous pullable resolves, and also when the iterable
    // is first started.
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const resumeDriver = (operation) => {
        // A single try/catch block is used per microtask.
        try {
            // The `step` function will, by default, stash the next operation directly in this
            // frame. If the stepper loop finishes while a pullable is still pending then `step`
            // will be overridden to `resumeDriver`. This iterative approach ensures the stack
            // doesn't grow continuously by recursively re-entering the driver over and over.
            let next = operation;
            let step = operation => {
                next = operation;
            };
            const stepChannel = {
                resolve: value => step(() => task.next(value)),
                reject: reason => step(() => task.throw(reason)),
                halt: reason => step(() => task.return(new HaltHolder(reason))),
            };
            // Continue stepping the iterable as long as it the yielded pullables resolve
            // synchronously.
            do {
                const result = next();
                next = null;
                if (result.done) {
                    cleanup();
                    resolveMaybeHalt(channel, result.value);
                    return;
                }
                // Pull the yielded value and continue when it resolves.
                pull(result.value, abortController.signal, stepChannel);
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
            } while (next);
            // We are now waiting on an asynchronous pullable resolution. Next invocation to `step`
            // will re-invoke this function.
            step = resumeDriver;
        }
        catch (error) {
            // An error was thrown from the iterable, therefore this operation resolves as an error.
            cleanup();
            channel.reject(error);
        }
    };
    // Begin execution
    resumeDriver(() => task.next());
}
//# sourceMappingURL=driver.js.map