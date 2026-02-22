import { useState, useRef } from "react";

const TaskInput = ({ onAdd }) => {
  const [inputValue, setInputValue] = useState(""); // store the input value
  const inputRef = useRef(null); // reference for focusing input

  // Called when Add button is clicked
  const handleAdd = () => {
    if (inputValue.trim() === "") return; // ignore empty input
    onAdd(inputValue); // call parent function
    setInputValue(""); // clear input
    inputRef.current.focus(); // focus input again
  };

  return (
    <div className="flex gap-2 p-4">
      <input
        type="text"
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Add a new task"
        className="flex-1 p-2 border rounded"
      />
      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white px-4 rounded"
      >
        Add
      </button>
    </div>
  );
};

export default TaskInput;
