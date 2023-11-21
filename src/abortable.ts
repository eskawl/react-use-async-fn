import { useCallback, useEffect, useRef } from "react";
import { AbortableLifecycle, AsyncState, BasicAbortableAsyncFn, TupleExceptFirst } from "./types";
import { noOp, useAsync } from "./async";

export interface useAbortableAsyncArgs<F extends BasicAbortableAsyncFn> {
  fn: F;
  onDone?: (
    result?: Awaited<ReturnType<F>>,
    ctx?: { args: Parameters<F> }
  ) => void;
  onError?: (
    error?: unknown,
    ctx?: { args: Parameters<F> }
  ) => void;
}

export const useAbortableAsync = <F extends BasicAbortableAsyncFn>({
  fn,
  onDone = () => void 0,
  onError = noOp,
}: useAbortableAsyncArgs<F>): [
  AsyncState<F>,
  {
    trigger: (
      ...args: TupleExceptFirst<Parameters<F>>
    ) => Promise<ReturnType<F>>;
    abort: () => void;
  }
] => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const [data, asyncTrigger] = useAsync<F>({
    fn,
    onDone,
    onError,
  });

  const trigger = useCallback(
    async (...args: TupleExceptFirst<Parameters<F>>) => {
      abortControllerRef.current = new AbortController();

      const result = await asyncTrigger(
        ...([
          {
            abortSignal: abortControllerRef.current?.signal,
          } as AbortableLifecycle,
          ...args,
        ] as unknown as Parameters<F>)
      );

      return result;
    },
    [asyncTrigger]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return abort;
  }, [abort]);

  return [data, { trigger, abort }];
};
