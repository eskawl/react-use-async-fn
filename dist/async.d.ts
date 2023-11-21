import { AsyncState, AsyncTrigger, BasicAsyncFn, useAsyncArgs } from "./types";
export declare const noOp: () => undefined;
export declare const useAsync: <F extends BasicAsyncFn>({ fn, onDone, onError, }: useAsyncArgs<F>) => [AsyncState<F>, AsyncTrigger<F>];
