import { useCallback } from "react";
import { AbortableLifecycle, STATUSES, useAbortableAsync, useAsync } from "../../dist/index";

const sleep = (ms=5000) => new Promise((r) => setTimeout(r, ms));

function abortbleSleep(ms=5000, {abortSignal}: AbortableLifecycle): Promise<string>{
  return new Promise((resolve, reject) => {
    console.log("Promise Started");
    
    // eslint-disable-next-line prefer-const
    let timeout: ReturnType<typeof setTimeout>;
    
    const abortHandler = () => {
      clearTimeout(timeout);
      reject(new Error("Aborted"));
    }
    
    // start async operation
    timeout = setTimeout(() => {
      resolve("Promise Resolved");
      abortSignal?.removeEventListener("abort", abortHandler);
    }, ms);    
    
    abortSignal?.addEventListener("abort", abortHandler);
  });
}

const AbortableDemo = () => {
  const [{ data, error, status }, {trigger, abort}] = useAbortableAsync({
    fn: abortbleSleep,
  });

  return (
    <div>
      <h2>Abortable</h2>
      <h3>data</h3>
      <p>{data}</p>
      <h3>status</h3>
      <p>{status}</p>
      <h3>error</h3>
      <p>{(error as Error)?.message}</p>
      <p>
        <button onClick={() => trigger(5000)}>Trigger with 5000 ms</button>
      </p>
      <p>
        <button disabled={status != STATUSES.WORKING} onClick={() => abort()}>Abort</button>
      </p>
    </div>
  )
}

function AsyncDemo() {
  const getData = useCallback(async (input: number) => {
    await sleep();
    return input + 1;
  }, []);

  const [{ data, error, status }, trigger] = useAsync({
    fn: getData,
  });

  return (
    <div>
      <h2>Async</h2>
      <h3>data</h3>
      <p>{data}</p>
      <h3>status</h3>
      <p>{status}</p>
      <h3>error</h3>
      <p>{error as string}</p>
      <button onClick={() => trigger(2)}>Trigger with 2</button>
    </div>
  );
}

const App = () => {
  return (
    <>
      <AsyncDemo />
      <AbortableDemo />
    </>
  )
}

export default App;
