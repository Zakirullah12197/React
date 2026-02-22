import { useState, useCallback, useEffect, useRef } from 'react'

function App() {
  const [length, setlength] = useState(8);
  const [numberAllowed, setNumberAllowed] = useState(false);
  const [charAllowed, setCharAllowed] = useState(false);
  const [password, setPassword] = useState("");

  const passwordGenerator = useCallback(() => {
    let pass = "";
    let str = "ABCDEFGHIJKLNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    if (numberAllowed) str += "123456789";
    if (charAllowed) str += "~!@#$%^&*()_";
    for (let i = 0; i <= length; i++) {
      let char = str.charAt(Math.floor(Math.random() * str.length));
      pass += char;
    }
    setPassword(pass);
  }, [length, numberAllowed, charAllowed, setPassword]);

  useEffect(() => {
    passwordGenerator();
  }, [passwordGenerator]);
  const passwordrefrence = useRef(null);
  const copyToClipboard = useCallback(() => {
    passwordrefrence.current?.select();
    // passwordrefrence.current?.setSelectionRange(0,10);
    window.navigator.clipboard.writeText(password);
  }, [password])
  return (
    <>
      <div className="w-full max-w-md mx-auto shadow-md rounded-lg px-4 py-3 my-8 bg-gray-800 text-orange-500">
        <h1 className='text-white text-center my-3'>Password generator</h1>
        <div className="flex shadow rounded-lg overflow-hidden mb-4">
          <input
            type="text"
            value={password}
            className="outline-none w-full py-1 px-3"
            placeholder='Password'
            readOnly
            ref={passwordrefrence}
          />
          <button
            onClick={copyToClipboard }
            className='outline-none hover:cursor-pointer active:bg-blue-300 hover:bg-blue-600 bg-blue-700 text-white px-3 py-0.5 shrink-0'
          >
            Copy
          </button>
        </div>
        <div className='flex text-sm gap-x-2'>
          <div className='flex items-center gap-x-1'>
            <input
              type="range"
              min={8}
              max={50}
              value={length}
              className='cursor-pointer'
              onChange={e => { setlength(e.target.value) }}
            />
            <label >Length: {length}</label>
          </div>
          <div className="flex items-center gap-x-1">
            <input
              type="checkbox"
              defaultChecked={numberAllowed}
              id="numberInput"
              onChange={() => {
                setNumberAllowed((prev) => !prev);
              }}
            />
            <label htmlFor="numberAllowed">Number</label>
          </div>

          <div className="flex items-center gap-x-1">
            <input
              type="checkbox"
              defaultChecked={charAllowed}
              id="numberInput"
              onChange={() => {
                setCharAllowed((prev) => !prev);
              }}
            />
            <label htmlFor="charAllowed">Character</label>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
