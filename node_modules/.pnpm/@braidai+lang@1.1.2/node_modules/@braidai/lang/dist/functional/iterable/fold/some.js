import { truthy } from "@braidai/lang/functional/iterable/filter";
import { Iterator } from "@braidai/lang/functional/iterable/intrinsicIterator";
export const some = function () {
    if (Iterator) {
        return (iterable, predicate = truthy) => Iterator.from(iterable).some(predicate);
    }
    else {
        return (iterable, predicate = truthy) => {
            let index = 0;
            for (const value of iterable) {
                if (Boolean(predicate(value, index++))) {
                    return true;
                }
            }
            return false;
        };
    }
}();
//# sourceMappingURL=some.js.map