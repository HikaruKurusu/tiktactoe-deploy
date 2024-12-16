import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000'); // Update with your server's address

const Game = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const room = queryParams.get('room');
  const [board, setBoard] = useState(Array(9).fill(null)); // Game board (9 squares)
  const [isXNext, setIsXNext] = useState(true); // Determine if it's X or O's turn
  const [winner, setWinner] = useState(null); // Winner state

  // Handle the game logic and WebSocket communication
  useEffect(() => {
    socket.emit('join_room', { room });

    socket.on('game_update', (data) => {
      setBoard(data.board);
      setIsXNext(data.isXNext);
      checkWinner(data.board);
    });

    return () => {
      socket.emit('leave_room', { room });
    };
  }, [room]);

  const checkWinner = (newBoard) => {
    // Check all possible winning combinations
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        setWinner(newBoard[a]);
        return;
      }
    }
  };

  const handleClick = (index) => {
    if (board[index] || winner) return; // Prevent clicking if square is filled or there's a winner

    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    // Emit the updated board to the opponent
    socket.emit('update_board', { room, board: newBoard, isXNext: !isXNext });
    checkWinner(newBoard);
  };

  const renderSquare = (index) => (
    <button className="square" onClick={() => handleClick(index)}>
      {board[index]}
    </button>
  );

  return (
    <div className="game-container">
      <h1>Game Room: {room}</h1>
      <div>
        {winner ? <h2>{winner} Wins!</h2> : <h2>Next player: {isXNext ? 'X' : 'O'}</h2>}
      </div>
      <div className="board">
        {Array(9)
          .fill(null)
          .map((_, index) => renderSquare(index))}
      </div>
    </div>
  );
};

export default Game;
