import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000');

function SearchForPlayer() {
  const [username, setUsername] = useState(''); // To display the username
  const [opponent, setOpponent] = useState(null);
  const [waiting, setWaiting] = useState(false); // Track if Player is waiting for an opponent
  const [room, setRoom] = useState(null); // Store the room once the game starts

  // Retrieve username and fetch the username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername); // Set username from localStorage
    }
  }, []);

  // Handle searching for an opponent
  const handleSearch = () => {
    if (!username) return; // Prevent empty username

    setWaiting(true);
    socket.emit('search_for_opponent_by_username', { username });

    // Listen for the game match response
    socket.on('game_found', (data) => {
      console.log('Game found:', data);
      setOpponent(data.opponent);
      setRoom(data.room);
      window.location.href = `/game?room=${data.room}&role=${data.role}`;  // Redirect to the game board
    });
  };

  // Effect to clean up socket listeners when component is unmounted
  useEffect(() => {
    return () => {
      socket.off('game_found'); // Remove listener when the component unmounts
    };
  }, []);

  return (
    <div>
      <h2>Search for an Opponent</h2>
      <p>Username: {username}</p> {/* Display username */}
      <button onClick={handleSearch} disabled={waiting}>Join Queue</button>
      {waiting && <p>Waiting for an opponent...</p>}
      {opponent && <p>Matched with: {opponent}</p>}
    </div>
  );
}

export default SearchForPlayer;
