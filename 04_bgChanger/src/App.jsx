import { useState } from "react";

function App() {
  const[color,setColor]=useState("grey")
  const colors = ["red", "blue", "green", "purple", "orange"];
  return (
    <div className="w-full h-screen border-4 items-center justify-center text-center"
    style={{backgroundColor: color}}>
      <div id="barContainer" className="">
        <div id="bar" className="flex flex-flex flex-wrap p-4 gap-4 ">
          {
            colors.map((clr, index) => (
              <button
                id={index}
                className="capitalize p-3 rounded-xl m-2 border-2"
                style={{ backgroundColor: clr }}
                onClick={()=>(setColor(clr))}
              >
                {clr}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default App
