import { useCallback, useEffect, useRef } from "react";
import {
  AbortableAsyncAbort,
  AbortableAsyncTrigger,
  AbortableLifecycle,
  AsyncState,
  BasicAsyncFn,
  TupleExceptLast,
  useAsyncArgs,
} from "./types";
import { noOp, useAsync } from "./async";

export const useAbortableAsync = <F extends BasicAsyncFn>({
  fn,
  onDone = noOp,
  onError = noOp,
}: useAsyncArgs<F>): [
  AsyncState<F>,
  {
    trigger: AbortableAsyncTrigger<F>;
    abort: AbortableAsyncAbort;
  },
] => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const [data, asyncTrigger] = useAsync<F>({
    fn,
    onDone,
    onError,
  });

  const trigger = useCallback(
    async (...args: TupleExceptLast<Parameters<F>>) => {
      abortControllerRef.current = new AbortController();

      const result = await asyncTrigger(
        ...([
          ...args,
          {
            abortSignal: abortControllerRef.current?.signal,
          } as AbortableLifecycle,
        ] as unknown as Parameters<F>),
      );

      return result;
    },
    [asyncTrigger],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return abort;
  }, [abort]);

  return [data, { trigger, abort }];
};
