## React Use Async Fn

React hook for managing the state of an async function

### Installing

Using NPM:

```bash
npm i react-use-async-fn
```

Using yarn:

```bash
yarn add react-use-async-fn
```

### Importing
```js
const { useAsync, STATES } = require('react-use-async-fn');
```
or in ES6
```js
import { useAsync, STATES } from 'react-use-async-fn';
```


### Usage:

#### Basic example:

```js
import { useCallback } from 'react'
import { useAsync, STATES } from 'react-use-async-fn';

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

```

You can provide your async function through the `fn` prop. 
The hook returns the state of the async function and a `trigger`.
You can run you async function by calling the `trigger`.
Any arguments provided to the trigger will be provided to your function.

If needed you can even `await` your function by using `await` on trigger.

```js
const onClick = async () => {
  const result = await trigger(2);
  console.log({ result })
}
```

### API

useAsync(props)

**props:**  
`fn`: Async function to track and execute.  
`onDone`: (Optional) Callback function called when the `fn` is ran successfully. It will be called with the result and the args provided to the `fn`.  
`onError`: (Optional) Callback function called when the `fn`failed with an error. It will be called with the error and the args provided to the `fn`.  


**returns:**  
Array of state, trigger.  
`[state, trigger]`

`state.data`: The return value of the `fn`. Initially `null`.  
`state.status`: `STATUS` of the function. One of [`INITIAL`, `WORKING`, `DONE`, `FAILED`]  
`state.error`: The error thrown by the `fn`. Initially `null`.  
`state.isLoading`: boolean. `true` if `state.status` is `STATUS.WORKING`.  
`trigger`: Function to call the provided `fn`. All arguments are forwarded to the `fn`.  

**STATUS:**
```js
STATES = {
  INITIAL: "INITIAL",
  WORKING: "WORKING",
  DONE: "DONE",
  FAILED: "FAILED",
};
```