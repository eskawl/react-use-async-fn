export declare const STATES: {
    INITIAL: string;
    WORKING: string;
    DONE: string;
    FAILED: string;
};
export interface useAsyncArgs<A extends any[] = any[], R = any> {
    fn: (...args: A) => Promise<R>;
    onDone?: (result?: R, ctx?: {
        args: A;
    }) => void;
    onError?: (error?: unknown, ctx?: {
        args: A;
    }) => void;
}
type ValueOf<T> = T[keyof T];
export declare const useAsync: <A extends any[] = any[], R = any>({ fn, onDone, onError }: useAsyncArgs<A, R>) => [{
    status: ValueOf<typeof STATES>;
    error: unknown | null;
    data: R | null;
    isLoading: boolean;
}, (...args: A) => Promise<R | undefined>];
export {};
