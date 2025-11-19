import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name || !email) {
      alert("Please enter both name and email.");
      return;
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-1 m-1"
      />
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-1 m-1"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-black px-2 py-1">
        Login User
      </button>
    </div>
  );
};

export default Login;
