import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import SmartTime from './SmartTime'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SmartTime />
    </>
  )
}

export default App
