import { invertedPredicate } from "@braidai/lang/predicate";
import { filterAsync } from "./filter.js";
export function rejectAsync(asyncIterable, predicate) {
    return filterAsync(asyncIterable, invertedPredicate(predicate));
}
//# sourceMappingURL=reject.js.map