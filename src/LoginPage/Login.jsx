import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import "./Login.css";
import bg from ".//assets/loginBG.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const endpoint = isRegistering ? "/register" : "/login";

    try {
      const response = await fetch(
        `https://hikarukurusu.pythonanywhere.com/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`${isRegistering ? "Registration" : "Login"} successful!`);
        if (!isRegistering) {
          navigate("/search"); // Redirect only after login
        }
      } else {
        setMessage(data.message || "An error occurred.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ x: -500 }}
      animate={{ x:0, scale: 1, transition: { duration: 1 } }}
      className="login"
    >
      <div class="login-content">
        <h1>{isRegistering ? "Register" : "Login"}</h1>
        <h2 className="sub-heading">
          {isRegistering
            ? "Create a new account to get started."
            : "Sign in to continue."}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">{isRegistering ? "Register" : "Login"}</button>
        </form>
        <p>
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Login here" : "Register here"}
          </span>
        </p>
        {message && (
          <p
            className={`message ${
              message.includes("error") ? "error" : "success"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default Login;
