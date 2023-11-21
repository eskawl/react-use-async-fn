/* eslint-disable @typescript-eslint/no-explicit-any */
import { STATUSES } from "./state";

/* Util Types */
export type ValueOf<T> = T[keyof T];
export type LastArgs<T extends (...args: any) => any> = Parameters<T> extends [
  any,
  ...infer L,
]
  ? L
  : never;
export type ParametersExceptFirst<F> = F extends (
  arg0: any,
  ...rest: infer R
) => any
  ? R
  : never;
export type TupleExceptFirst<T> = T extends [any, ...rest: infer R] ? R : never;
export type TupleExceptLast<T> = T extends [...first: infer F, any] ? F : never;

export type BasicAsyncFn = (...args: any[]) => Promise<any>;

export interface useAsyncArgs<F extends BasicAsyncFn> {
  fn: F;
  onDone?: (
    result: Awaited<ReturnType<F>>,
    ctx: { args: Parameters<F> },
  ) => void;
  onError?: (error: unknown, ctx: { args: Parameters<F> }) => void;
}

export interface AsyncState<F extends BasicAsyncFn> {
  status: ValueOf<typeof STATUSES>;
  error: unknown | null;
  data: Awaited<ReturnType<F>> | null;
  isLoading: boolean;
}

export type AsyncTrigger<F extends BasicAsyncFn> = (
  ...args: Parameters<F>
) => Promise<Awaited<ReturnType<F>>>;

export interface AbortableLifecycle {
  abortSignal: AbortSignal;
}

export type BasicAbortableAsyncFn = (
  ...args: [...any[], AbortableLifecycle]
) => Promise<any>;

export interface useAbortableAsyncArgs<F extends BasicAbortableAsyncFn> {
  fn: F;
  onDone?: (
    result?: Awaited<ReturnType<F>>,
    ctx?: { args: Parameters<F> },
  ) => void;
  onError?: (error?: unknown, ctx?: { args: Parameters<F> }) => void;
}

export type AbortableAsyncTrigger<F extends BasicAbortableAsyncFn> = (
  ...args: TupleExceptLast<Parameters<F>>
) => Promise<ReturnType<F>>;

export type AbortableAsyncAbort = () => void;

// const _f1: BasicAbortableAsyncFn = async (a: number, b: string, _lc: AbortableLifecycle) => {
//   return a+b;
// }

// const _f2: BasicAsyncFn = _f1;
