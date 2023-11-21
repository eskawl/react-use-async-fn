import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STATES = {
  INITIAL: "INITIAL",
  WORKING: "WORKING",
  DONE: "DONE",
  FAILED: "FAILED",
};

const noOp = () => undefined;

/* Util Types */
type ValueOf<T> = T[keyof T];

type LastArgs<T extends (...args: any) => any> = Parameters<T> extends [
  any,
  ...infer L
]
  ? L
  : never;
type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any
  ? R
  : never;

type TupleExceptFirst<T> = T extends [any, ...rest: infer R] ? R : never;

export type BasicAsyncFn = (...args: any[]) => Promise<any>;

export interface useAsyncArgs<F extends BasicAsyncFn> {
  fn: F;
  onDone?: (
    result: Awaited<ReturnType<F>>,
    ctx: { args: Parameters<F> }
  ) => void;
  onError?: (error: unknown, ctx: { args: Parameters<F> }) => void;
}

export interface AsyncState<F extends BasicAsyncFn> {
  status: ValueOf<typeof STATES>;
  error: unknown | null;
  data: Awaited<ReturnType<F>> | null;
  isLoading: boolean;
}

export type AsyncTrigger<F extends BasicAsyncFn> = (
  ...args: Parameters<F>
) => Promise<Awaited<ReturnType<F>>>;

export const useAsync = <F extends BasicAsyncFn>({
  fn,
  onDone = noOp,
  onError = noOp,
}: useAsyncArgs<F>): [AsyncState<F>, AsyncTrigger<F>] => {
  const [data, setData] = useState<Awaited<ReturnType<F>> | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [status, setStatus] = useState<ValueOf<typeof STATES>>(STATES.INITIAL);

  const isLoading = useMemo(() => status === STATES.WORKING, [status]);

  const trigger = useCallback(
    async (...args: Parameters<F>) => {
      try {
        setStatus(STATES.WORKING);

        const result = await fn(...args);

        setData(result);
        setStatus(STATES.DONE);
        onDone(result, {
          args,
        });
        return result;
      } catch (error) {
        setData(null);
        setError(error);
        setStatus(STATES.FAILED);
        onError(error, {
          args,
        });
        return;
      }
    },
    [fn, onDone, onError]
  );

  return [{ status, data, error, isLoading }, trigger];
};

interface AbortableLifecycle {
  abortSignal: AbortSignal;
}

export type BasicAbortableAsyncFn = (
  lc: AbortableLifecycle,
  ...args: any[]
) => Promise<any>;

export interface useAbortableAsyncArgs<F extends BasicAbortableAsyncFn> {
  fn: F;
  onDone?: (
    result?: Awaited<ReturnType<F>>,
    ctx?: { args: TupleExceptFirst<Parameters<F>> }
  ) => void;
  onError?: (
    error?: unknown,
    ctx?: { args: TupleExceptFirst<Parameters<F>> }
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

  const handleOnDone = useCallback(
    (result: Awaited<ReturnType<F>>, { args }: { args: Parameters<F> }) => {
      if (onDone) {
        return onDone(result, {
          args: args?.slice(1) as TupleExceptFirst<Parameters<F>>, // Remove the abort signal
        });
      }
    },
    [onDone]
  );

  const handleOnError = useCallback(
    (error: unknown, { args }: { args: Parameters<F> }) => {
      if (onError) {
        return onError(error, {
          args: args?.slice(1) as TupleExceptFirst<Parameters<F>>, // Remove the abort signal
        });
      }
    },
    [onError]
  );

  const [data, asyncTrigger] = useAsync<F>({
    fn,
    onDone: handleOnDone,
    onError: handleOnError,
  });

  const trigger = useCallback(
    async (...args: TupleExceptFirst<Parameters<F>>) => {
      abortControllerRef.current = new AbortController();

      const result = await asyncTrigger(
        ...([
          {
            abortSignal: abortControllerRef.current.signal,
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
