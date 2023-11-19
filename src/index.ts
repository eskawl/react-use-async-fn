import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const STATES = {
  INITIAL: "INITIAL",
  WORKING: "WORKING",
  DONE: "DONE",
  FAILED: "FAILED",
};

const noOp = () => undefined;

export interface useAsyncArgs <A extends any[], R=any>{
  fn: (...args: A) => Promise<R>,
  onDone?: (result?: R, ctx?: { args: A}) => void,
  onError?: (error?: unknown, ctx?: { args: A}) => void,
}

type ValueOf<T> = T[keyof T];

export const useAsync = <A extends any[]=any[], R=any>({ fn, onDone = noOp, onError = noOp }: useAsyncArgs<A, R>): [
  {status: ValueOf<typeof STATES>, error: unknown|null, data: R|null, isLoading: boolean},
  (...args: A) => Promise<R | undefined>
] => {
  const [data, setData] = useState<R|null>(null);
  const [error, setError] = useState<unknown|null>(null);
  const [status, setStatus] = useState<ValueOf<typeof STATES>>(STATES.INITIAL);

  const isLoading = useMemo(() => status === STATES.WORKING, [status]);

  const trigger = useCallback(
    async (...args: A) => {
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

// type LastArgs<T extends (...args: any) => any> = Parameters<T> extends [AbortableLifecylce, ...infer LAST] ? LAST : never
type ParametersExceptFirst<F> = 
   F extends (arg0: any, ...rest: infer R) => any ? R : never;

type TupleExceptFirst<T> = T extends [AbortableLifecycle, ...rest: infer R] ? R: never;

interface AbortableLifecycle {
  abortSignal: AbortSignal,
}

type BaseAsyncFn<B extends any[], R=any> = (...args: B) => Promise<R>
type CoreAbortableFn<A extends any[], R=any>  = (lc: AbortableLifecycle, ...args: A) => Promise<R>
type AbortableFn<B extends any[], A extends any[], R=any> = CoreAbortableFn<A, R> extends BaseAsyncFn<B,R> ? CoreAbortableFn<A, R> : never;

type BaseOnDoneFn<B, R> = (result?: R, ctx?: { args: B}) => void
type CoreOnDoneFn<A extends any[], R> = (result?: R, ctx?: { args: A}) => void
type AbortableOnDoneFn<B, A extends any[],R> = CoreOnDoneFn<A, R> extends BaseOnDoneFn<B,R> ? CoreOnDoneFn<A, R> : never;

export interface useAbortableAsyncArgs <B extends any[], A extends any[], R=any>{
  fn: AbortableFn<B,A,R>,
  onDone?: AbortableOnDoneFn<B,A,R>,
  onError?: (error?: unknown, ctx?: { args: B}) => void,
}

export const useAbortableAsync = <
  B extends [AbortableLifecycle, ...A],
  A extends any[],
  R = any
>({
  fn,
  onDone = (() => void 0) as AbortableOnDoneFn<B, A, R>,
  onError = noOp,
}: useAbortableAsyncArgs<B, A, R>): [
  {
    status: ValueOf<typeof STATES>;
    error: unknown | null;
    data: R | null;
    isLoading: boolean;
  },
  {
    trigger: (...args: A) => Promise<R | undefined>;
    abort: () => void;
  }
] => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const [data, asyncTrigger] = useAsync<B, R>({
    fn,
    onDone,
    onError,
  });

  const trigger = useCallback(
    (...args: A) => {
      abortControllerRef.current = new AbortController();

      return asyncTrigger(
       ...[
          { abortSignal: abortControllerRef.current.signal },
          ...args
        ] as B
      );
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
