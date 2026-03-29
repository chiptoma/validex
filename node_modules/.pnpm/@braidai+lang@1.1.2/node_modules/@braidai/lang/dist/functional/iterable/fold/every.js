import { truthy } from "@braidai/lang/functional/iterable/filter";
import { Iterator } from "@braidai/lang/functional/iterable/intrinsicIterator";
import { some } from "./some.js";
export const every = function () {
    if (Iterator) {
        return (iterable, predicate = truthy) => Iterator.from(iterable).every(predicate);
    }
    else {
        return (iterable, predicate = truthy) => !some(iterable, (value, index) => !Boolean(predicate(value, index)));
    }
}();
//# sourceMappingURL=every.js.map