import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Game.css';

const socket = io('https://git.heroku.com/tictactoe-diploy.git/'); // Update with your server's address

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const room = queryParams.get('room');
  const role = queryParams.get('role');
  const wins = queryParams.get('wins');
  const opponentWins = queryParams.get('opponent_wins');
  const username = queryParams.get('username');
  const opponent_username = queryParams.get('opponent_username');
  const [board, setBoard] = useState(Array(9).fill(null)); // Game board (9 squares)
  const [isXNext, setIsXNext] = useState(true); // Determine if it's X or O's turn
  const [winner, setWinner] = useState(null); // Winner state
  const [opponent, setOpponent] = useState(''); // Opponent's username
  const [userID, setUserID] = useState('');


  useEffect(() => {
    const storedUserID = localStorage.getItem('userID');
    if (storedUserID) {
      setUserID(storedUserID);
    }
  }, []);

  // Handle the game logic and WebSocket communication
  useEffect(() => {
    socket.emit('join_room', { room });

    socket.on('game_update', (data) => {
      setBoard(data.board);
      setIsXNext(data.isXNext);
      checkWinner(data.board);
    });

    // Listen for the opponent's username
    socket.on('opponent_info', (data) => {
      setOpponent(data.opponent);
    });

    // Listen for game over event
    socket.on('game_over', () => {
      navigate('/search', { state: { userID } });
    });

    return () => {
      socket.emit('leave_room', { room });
      socket.off('game_update');
      socket.off('opponent_info');
      socket.off('game_over') // Clean up the listener
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
        if (newBoard[a] === role)  {
          socket.emit('update_board', { room, board: Array(9).fill(null), isXNext: true, winner: true, username: username });
        }
        setTimeout(() => {
          resetBoard();
          socket.emit('game_over', { room });
        }, 3000); // Wait 3 seconds before resetting the board
        
        return;
      }
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    socket.emit('update_board', { room, board: Array(9).fill(null), isXNext: true, winner: false, username: username });
  };

  const handleClick = (index) => {
    if (board[index] || winner || (role === 'X' && !isXNext) || (role === 'O' && isXNext)) return; // Prevent clicking if square is filled or there's a winner

    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    // Emit the updated board to the opponent
    socket.emit('update_board', { room, board: newBoard, isXNext: !isXNext, winner: false, username: username });
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
      <h2>Player: {username}</h2>
      <h2>Opponent: {opponent_username}</h2>
      <h2>Your Role: {role}</h2>
      <h2>Your Wins: {wins}</h2>
      <h2>Opponent Wins: {opponentWins}</h2>
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