import { AbortableAsyncAbort, AbortableAsyncTrigger, AsyncState, BasicAsyncFn, useAsyncArgs } from "./types";
export declare const useAbortableAsync: <F extends BasicAsyncFn>({ fn, onDone, onError, }: useAsyncArgs<F>) => [AsyncState<F>, {
    trigger: AbortableAsyncTrigger<F>;
    abort: AbortableAsyncAbort;
}];
