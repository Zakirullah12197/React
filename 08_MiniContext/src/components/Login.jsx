import React, { useContext, useState } from 'react'
import UserContext from '../context/UserContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(UserContext);

  const handleSubmit = () => {
    setUser({ username, password });
    setPassword("");
    setUsername('');

  };

  return (
    <div className=" flex items-center justify-center mt-20 mb-3">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg">
        
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Login
        </h2>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full mb-4 px-4 py-2 border border-black rounded-lg placeholder-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full mb-6 px-4 py-2 border border-black rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded-lg 
                     hover:bg-blue-700 transition duration-200"
        >
          Submit
        </button>

      </div>
    </div>
  );
}
export default Login;
