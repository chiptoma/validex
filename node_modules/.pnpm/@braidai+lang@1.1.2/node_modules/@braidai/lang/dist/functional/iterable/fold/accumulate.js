import { identity } from "@braidai/lang/functional/function/identity";
import { map } from "@braidai/lang/functional/iterable/map";
import { fold } from "./fold.js";
const add = (left, right) => left + right;
export function accumulate(iterable, mapper = identity) {
    return fold(map(iterable, mapper), -0, add);
}
//# sourceMappingURL=accumulate.js.map