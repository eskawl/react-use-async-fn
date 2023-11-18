import { useCallback, useMemo, useState } from "react";

export const STATES = {
  INITIAL: "INITIAL",
  WORKING: "WORKING",
  DONE: "DONE",
  FAILED: "FAILED",
};

const noOp = () => undefined;

export interface useAsyncArgs <A extends any[]=any[], R=any>{
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

