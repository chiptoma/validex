import { identity } from "@braidai/lang/functional/function/identity";
import { map } from "@braidai/lang/functional/iterable/map";
export function groupBy(iterable, mapper = identity) {
    const groups = new Map();
    for (const [key, value] of map(iterable, mapper)) {
        const values = groups.get(key);
        if (values) {
            values.push(value);
        }
        else {
            groups.set(key, [value]);
        }
    }
    return groups;
}
//# sourceMappingURL=groupBy.js.map