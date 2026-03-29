import { truthy } from "@braidai/lang/functional/iterable/filter";
export async function* filterAsync(asyncIterable, predicate = truthy) {
    let index = 0;
    for await (const value of asyncIterable) {
        if (Boolean(predicate(value, index++))) {
            yield value;
        }
    }
}
//# sourceMappingURL=filter.js.map