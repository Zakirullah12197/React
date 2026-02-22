import { useState } from 'react'
import './App.css'

function App() {
  let [counter, setCounter] = useState(10)
  const increaseValue = () => {
    if(counter==20)return;
    // ----------------- what will happen here
    setCounter(counter + 1);
    setCounter(counter + 1);
    setCounter(counter + 1);
    setCounter(counter + 1);
  }
  const decreaseValue = () => {
    if(counter==0) return;
    // ----------------- what will happen here
    setCounter(counter - 1);    
    setCounter(counter - 1);
    setCounter(counter - 1);
    setCounter(counter - 1);
  }
  return (
    <>
      <h2>Counter : {counter}</h2>
      <button
        onClick={increaseValue}>
        Increase {counter}
      </button>
      <br />
      <button
        onClick={decreaseValue}>
        Decrease {counter}</button>
      <p>Counter : {counter}</p>
    </>
  )
}

export default App
