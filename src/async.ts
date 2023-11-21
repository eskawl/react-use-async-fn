import { useCallback, useMemo, useState } from "react";
import { STATUSES } from "./state";
import {
  AsyncState,
  AsyncTrigger,
  BasicAsyncFn,
  ValueOf,
  useAsyncArgs,
} from "./types";

export const noOp = () => undefined;

export const useAsync = <F extends BasicAsyncFn>({
  fn,
  onDone = noOp,
  onError = noOp,
}: useAsyncArgs<F>): [AsyncState<F>, AsyncTrigger<F>] => {
  const [data, setData] = useState<Awaited<ReturnType<F>> | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [status, setStatus] = useState<ValueOf<typeof STATUSES>>(
    STATUSES.INITIAL,
  );

  const isLoading = useMemo(() => status === STATUSES.WORKING, [status]);

  const trigger = useCallback(
    async (...args: Parameters<F>) => {
      try {
        setStatus(STATUSES.WORKING);

        const result = await fn(...args);

        setData(result);
        setStatus(STATUSES.DONE);
        onDone(result, {
          args,
        });
        return result;
      } catch (error) {
        setData(null);
        setError(error);
        setStatus(STATUSES.FAILED);
        onError(error, {
          args,
        });
        return;
      }
    },
    [fn, onDone, onError],
  );

  return [{ status, data, error, isLoading }, trigger];
};
