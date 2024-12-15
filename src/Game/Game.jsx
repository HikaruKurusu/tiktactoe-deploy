// import React, { useState } from 'react';
// import './Game.css';
// const Game = () => {
//   const [board, setBoard] = useState(Array(9).fill(null)); // Game board (9 squares)
//   const [isXNext, setIsXNext] = useState(true); // Determine if it's X or O's turn
//   const [winner, setWinner] = useState(null); // Winner state

//   // Check for a winner
//   const calculateWinner = (squares) => {
//     const lines = [
//       [0, 1, 2],
//       [3, 4, 5],
//       [6, 7, 8],
//       [0, 3, 6],
//       [1, 4, 7],
//       [2, 5, 8],
//       [0, 4, 8],
//       [2, 4, 6],
//     ];

//     for (let i = 0; i < lines.length; i++) {
//       const [a, b, c] = lines[i];
//       if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
//         return squares[a]; // Return 'X' or 'O'
//       }
//     }
//     return null;
//   };

//   // Handle a square click
//   const handleClick = (index) => {
//     if (board[index] || winner) return; // Prevent clicking if square is filled or there's a winner

//     const newBoard = board.slice(); // Copy the board
//     newBoard[index] = isXNext ? 'X' : 'O'; // Set the current player's mark (X or O)
//     setBoard(newBoard); // Update the board
//     setIsXNext(!isXNext); // Switch to the next player

//     const currentWinner = calculateWinner(newBoard);
//     if (currentWinner) {
//       setWinner(currentWinner); // Set winner if there's one
//     }
//   };

//   // Render the Tic Tac Toe board
//   const renderSquare = (index) => {
//     return (
//       <button className="square" onClick={() => handleClick(index)}>
//         {board[index]}
//       </button>
//     );
//   };

//   return (
//     <div className="game-container">
//       <h1>Welcome to the Tic Tac Toe Game!</h1>
//       <div>
//         {winner ? <h2>{winner} Wins!</h2> : <h2>Next player: {isXNext ? 'X' : 'O'}</h2>}
//       </div>
//       <div className="board">
//         {Array(9)
//           .fill(null)
//           .map((_, index) => renderSquare(index))}
//       </div>
//     </div>
//   );
// };

// export default Game;
