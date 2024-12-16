import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000');

function SearchForPlayer() {
  const [username, setUsername] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [waiting, setWaiting] = useState(false); // Track if Player 1 is waiting for an opponent
  const [room, setRoom] = useState(null); // Store the room once the game starts

  // Handle searching for an opponent
  const handleSearch = () => {
    if (!username) return; // Prevent empty username

    setWaiting(true);
    socket.emit('search_for_opponent', { username });

    // Listen for the game match response
    socket.on('game_found', (data) => {
      console.log('Game found:', data);
      setOpponent(data.opponent);
      setRoom(data.room);
      window.location.href = `/game?room=${data.room}`;  // Redirect to the game board
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
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleSearch} disabled={waiting}>Search</button>
      {waiting && <p>Waiting for an opponent...</p>}
      {opponent && <p>Matched with: {opponent}</p>}
    </div>
  );
}

export default SearchForPlayer;
