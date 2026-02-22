function TaskList({ tasks ,toggleTask }) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li
            key={task.id}
            className={`bg-gray-300 p-2 rounded mb-2 flex items-center justify-between ${task.completed ? "line-through text-gray-500" : ""}`}>
            <span>{task.title}</span>
            <input type="checkbox"
             checked={task.completed} 
             onChange={()=>toggleTask(task.id)} />
          </li>
        ))}
      </ul>
    </div >
  )
}

export default TaskList;