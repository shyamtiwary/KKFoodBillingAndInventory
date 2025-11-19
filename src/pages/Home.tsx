import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
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
    </div>
  );
};

export default Home;
