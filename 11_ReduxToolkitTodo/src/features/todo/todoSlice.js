import { createSlice, nanoid } from "@reduxjs/toolkit";

export const todoSlice = createSlice({
    name: "todo",
    initialState: {
        todos: [{ id: 1, text: "Do Something", completed: false }]
    },
    reducers: {
        addTodo: (state, action) => {
            const todo = {
                id: nanoid(),
                text: action.payload.text,
                completed: false
            }
            state.todos.push(todo);
        },
        removeTodo: (state, action) => {
            state.todos = state.todos.filter((todo) => (todo.id !== action.payload))
        },
        updateTodo: (state, action) => {
            state.todos = state.todos.map(
                (todo) => ((todo.id === action.payload.id)
                    ? { ...todo, text: action.payload.text }
                    : todo))
        }
    }
})
export const { addTodo, updateTodo, removeTodo } = todoSlice.actions
export default todoSlice.reducer;