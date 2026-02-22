import Navbar from "./components/Navbar";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import { useState } from 'react'
function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Learn React Basics", completed: false },
    { id: 2, title: "Practice Tailwind", completed: false },
    { id: 3, title: "Build Task Manager", completed: false },
  ]);

  function toggleTask(id) {
    return setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

function addTask(title) {
  const newTask = {
    id : Date.now(),
    title,
    completed:false
  };
  setTasks([...tasks,newTask]);
}
  return (
    <>
      <Navbar />
      <TaskInput onAdd={addTask}/>  
      <TaskList tasks={tasks} toggleTask={toggleTask} />
    </>
  )
}

export default App
