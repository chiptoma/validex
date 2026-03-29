import { filter } from "@braidai/lang/functional/iterable/filter";
import { Iterator } from "@braidai/lang/functional/iterable/intrinsicIterator";
import { first } from "./first.js";
export const find = function () {
    if (Iterator) {
        return (iterable, predicate) => Iterator.from(iterable).find(predicate);
    }
    else {
        return (iterable, predicate) => first(filter(iterable, predicate));
    }
}();
//# sourceMappingURL=find.js.map