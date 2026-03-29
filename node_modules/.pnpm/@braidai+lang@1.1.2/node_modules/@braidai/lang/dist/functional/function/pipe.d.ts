/**
 * The pipeline operator is stuck in specification hell so this works as a replacement to unfold
 * sequential operations.
 * https://github.com/tc39/proposal-pipeline-operator/blob/main/HISTORY.md
 */
export declare function pipe<T0, T1>(vv: T0, fn0: (vv: T0) => T1): T1;
export declare function pipe<T0, T1, T2>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2): T2;
export declare function pipe<T0, T1, T2, T3>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3): T3;
export declare function pipe<T0, T1, T2, T3, T4>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4): T4;
export declare function pipe<T0, T1, T2, T3, T4, T5>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5): T5;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6): T6;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7): T7;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7, T8>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7, fn7: (vv: T7) => T8): T8;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7, fn7: (vv: T7) => T8, fn8: (vv: T8) => T9): T9;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7, fn7: (vv: T7) => T8, fn8: (vv: T8) => T9, fn9: (vv: T9) => T10): T10;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7, fn7: (vv: T7) => T8, fn8: (vv: T8) => T9, fn9: (vv: T9) => T10, fn10: (vv: T10) => T11): T11;
export declare function pipe<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(vv: T0, fn0: (vv: T0) => T1, fn1: (vv: T1) => T2, fn2: (vv: T2) => T3, fn3: (vv: T3) => T4, fn4: (vv: T4) => T5, fn5: (vv: T5) => T6, fn6: (vv: T6) => T7, fn7: (vv: T7) => T8, fn8: (vv: T8) => T9, fn9: (vv: T9) => T10, fn10: (vv: T10) => T11, fn11: (vv: T11) => T12): T12;
//# sourceMappingURL=pipe.d.ts.map