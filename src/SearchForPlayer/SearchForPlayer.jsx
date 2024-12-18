import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

import "./SearchForPlayer.css";

const socket = io("https://hikarukurusu.pythonanywhere.com//");

function SearchForPlayer() {
  const [userID, setUserID] = useState("");
  const [username, setUsername] = useState(""); // To display the username
  const [opponent, setOpponent] = useState(null);
  const [waiting, setWaiting] = useState(false); // Track if Player is waiting for an opponent
  const [room, setRoom] = useState(null); // Store the room once the game starts
  const location = useLocation();

  // Retrieve userID from localStorage and fetch the username
  useEffect(() => {
    const stateUserID = location.state?.userID;
    const storedUserID = stateUserID || localStorage.getItem("userID");
    if (storedUserID) {
      setUserID(storedUserID); // Set userID from localStorage

      // Fetch username from the backend using userID
      fetch("https://hikarukurusu.pythonanywhere.com/get_username_by_id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: storedUserID }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.username) {
            setUsername(data.username); // Set username from the backend response
          }
        })
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);

  // Handle searching for an opponent
  const handleSearch = () => {
    if (!userID) return; // Prevent empty userID
    console.log(userID);
    setWaiting(true);
    socket.emit("search_for_opponent_by_id", { userID });

    // Listen for the game match response
    socket.on("game_found", (data) => {
      console.log("Game found:", data);
      setOpponent(data.opponent);
      setRoom(data.room);
      window.location.href = `/game?room=${data.room}&role=${data.role}&wins=${data.wins}&opponent_wins=${data.opponent_wins}&username=${data.username}`; // Redirect to the game board
    });
  };

  // Effect to clean up socket listeners when component is unmounted
  useEffect(() => {
    return () => {
      socket.off("game_found"); // Remove listener when the component unmounts
    };
  }, []);


  return (
    <div className="SearchForPlayer">
     <div className="background"></div>
    <div className="container">
    <div className="box">
    <h2>Search for an Opponent</h2>
        <p>Username: {username}</p> {/* Display username */}
        <button onClick={handleSearch} disabled={waiting}>
          Join Queue
        </button>
        {waiting && <p>Waiting for an opponent...</p>}
        {opponent && <p>Matched with: {opponent}</p>}
        {waiting && <div className="loading-circle"></div>}
      </div>
    </div>
    </div>



  );
}

export default SearchForPlayer;
