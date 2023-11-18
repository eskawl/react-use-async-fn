import { useCallback } from 'react'
import { useAsync } from '../../dist/index';

const sleep = () => new Promise(r => setTimeout(r, 5000))

function App() {
  const getData = useCallback(async (input: number) => {
    await sleep();
    return input + 1;
  }, []);

  const [{ data, error, status}, trigger] = useAsync({
    fn: getData,
  });

  return (
    <div>
      <h3>data</h3>
      <p>{data}</p>
      <h3>status</h3>
      <p>{status}</p>
      <h3>error</h3>
      <p>{error as string}</p>
      <button onClick={() => trigger(2)}>Trigger with 2</button>
    </div>
  )
}

export default App
