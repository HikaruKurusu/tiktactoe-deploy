import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import "./Login.css";
import bg from '../assets/loginBG.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';

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
        setMessage(`${isRegistering ? 'Registration' : 'Login'} successful!`);
        
        // Save userID in localStorage
        const userID = data.id; // Extract userID from response
        const storedUserID = localStorage.getItem('userID');
        if (storedUserID) {
          console.log('Stored userID:', storedUserID);
        }
        localStorage.setItem('userID', userID); // Store userID in local storage
        // Redirect to search page after login
        if (!isRegistering) {
          navigate('/search'); 
        }
      } else {
        setMessage(data.message || 'An error occurred.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const containerVariants = {
    initial: { x: -500}, // Animation when the page loads
    login: { x: 0, scale: 1, transition: { duration: 1 }}, // Default login view
    register: {
      scale:[1, 0, 1], // Shrink down to scale 0, then back to scale 1
      opacity: 1,
      x: 0,
      transition: { duration: 1, ease: "easeInOut" },
    },
  };

  return (
    <div style={{ overflow: "hidden", height: "100vh" }}>
      {/* Background Image Motion */}
      <motion.div
        initial={{ x: -2000 }}
        animate={{ x: 0 }}
        transition={{ duration: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      ></motion.div>

      <motion.div
       initial={{ x: "-100%", y: "-100%" }} // Starts off-screen
       animate={{ x: "0%", y: "200%" }} // Moves to the center
        className="title2"
      >
        <span >T</span>
        <span className="middle-letter">I</span>
        <span >C</span>&nbsp;

        <span >T</span>
        <span className="middle-letter">A</span>
        <span >C </span>&nbsp;

        <span >T</span>
        <span className="middle-letter">O</span>
        <span >E</span>

       
      
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial="initial"
        variants={containerVariants}
        animate={isRegistering ? "register" : "login"} 
     
        className="login"
        style={{
          transformOrigin: "center", // Scale animation originates from the center
        }}
      >
        <div className="login-content">
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
              onClick={() => {
                setIsRegistering(!isRegistering);
             
              }}
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
    </div>
  );
};

export default Login;
