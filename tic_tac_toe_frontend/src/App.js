import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color and style config (from requirements)
 * accent:   #ff5722
 * primary:  #1976d2
 * secondary: #ffffff
 */
const COLORS = {
  accent: '#ff5722',
  primary: '#1976d2',
  secondary: '#ffffff',
  lightWin: '#e3f2fd',
  lightDraw: '#f5f9ff',
};

// --- Pure game logic helpers ---

// Calculates winner and winning line; returns {winner, winningLine} or null
function calculateWinner(squares) {
  // lines are [a,b,c] indices for rows, cols, diags
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];
  for (let [a,b,c] of lines) {
    if(squares[a] &&
      squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], winningLine: [a, b, c] };
    }
  }
  return null;
}

// Checks if all cells filled and no winner
function isDraw(squares) {
  return squares.every(Boolean) && !calculateWinner(squares);
}

// --- AI (simple random, can be improved to minimax if desired) ---
function getAIMove(squares, aiPlayer, humanPlayer) {
  // Try to win if possible, else block, else random
  const emptyIndices = squares.map((v, i) => v ? null : i).filter(v => v !== null);

  // Try to win
  for (let idx of emptyIndices) {
    const temp = squares.slice();
    temp[idx] = aiPlayer;
    if (calculateWinner(temp)) return idx;
  }
  // Try to block
  for (let idx of emptyIndices) {
    const temp = squares.slice();
    temp[idx] = humanPlayer;
    if (calculateWinner(temp)) return idx;
  }
  // Pick random
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// --- Board Cell component ---
function Square({ value, onClick, highlight }) {
  return (
    <button
      className="ttt-square"
      style={{
        color: value === 'X' ? COLORS.primary : (value === 'O' ? COLORS.accent : undefined),
        background: highlight ? COLORS.lightWin : COLORS.secondary,
        borderColor: highlight ? COLORS.accent : COLORS.primary
      }}
      onClick={onClick}
      aria-label={`Cell ${value || 'empty'}`}
    >
      {value}
    </button>
  );
}

// --- Main Board UI ---
function Board({ squares, onSquareClick, winningLine }) {
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {Array(3).fill(null).map((_, row) => (
        <div className="ttt-row" key={row} role="row">
          {Array(3).fill(null).map((_, col) => {
            const idx = 3 * row + col;
            return (
              <Square
                key={idx}
                value={squares[idx]}
                highlight={winningLine && winningLine.includes(idx)}
                onClick={() => onSquareClick(idx)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Local Storage logic for persistent score ---
function loadScore() {
  try {
    const s = localStorage.getItem('ttt-score');
    if (!s) return { X: 0, O: 0, draw: 0 };
    return JSON.parse(s);
  } catch {
    return { X: 0, O: 0, draw: 0 };
  }
}

function saveScore(score) {
  try {
    localStorage.setItem('ttt-score', JSON.stringify(score));
  } catch {}
}

// --- Header and game info ---
function GameHeader({ mode, setMode }) {
  return (
    <div className="ttt-header">
      <h1 className="ttt-title">Tic Tac Toe</h1>
      <div className="ttt-modes">
        <button
          className={`ttt-mode-btn ${mode === 'PVP' ? 'active' : ''}`}
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          onClick={() => setMode('PVP')}
        >
          2 Players
        </button>
        <button
          className={`ttt-mode-btn ${mode === 'AI' ? 'active' : ''}`}
          style={{ borderColor: COLORS.accent, color: COLORS.accent }}
          onClick={() => setMode('AI')}
        >
          vs AI
        </button>
      </div>
    </div>
  );
}

// --- Scoreboard ---
function Scoreboard({ score }) {
  return (
    <div className="ttt-scoreboard">
      <div>
        <span style={{ color: COLORS.primary, fontWeight: 600 }}>X</span>: {score.X}
      </div>
      <div>
        <span style={{ color: COLORS.accent, fontWeight: 600 }}>O</span>: {score.O}
      </div>
      <div>
        <span style={{ color: '#666', fontWeight: 500 }}>Draw</span>: {score.draw}
      </div>
    </div>
  );
}

// --- Game controls ---
function GameControls({ onRestart, mode, setMode }) {
  return (
    <div className="ttt-controls">
      <button className="ttt-btn ttt-restart" onClick={onRestart}>
        ⟳ Restart
      </button>
    </div>
  );
}

// --- Player indicator ---
function PlayerIndicator({ xIsNext, isGameOver, winner, mode }) {
  let content;
  if (isGameOver && winner) {
    content = (
      <>
        <span style={{ color: winner === 'X' ? COLORS.primary : COLORS.accent, fontWeight: 600 }}>
          {winner}
        </span> wins!
      </>
    );
  } else if (isGameOver) {
    content = <span style={{ color: '#888', fontWeight: 500 }}>Draw</span>;
  } else {
    content = (
      <>
        {mode === 'AI'
          ? (
            <>
              <span style={{ color: xIsNext ? COLORS.primary : COLORS.accent, fontWeight: 600 }}>
                {xIsNext ? 'You' : 'AI'}
              </span>
              &nbsp;turn
            </>
          )
          : (
            <>
              <span style={{ color: xIsNext ? COLORS.primary : COLORS.accent, fontWeight: 600 }}>
                {xIsNext ? 'X' : 'O'}
              </span>
              {`'s turn`}
            </>
          )
        }
      </>
    );
  }
  return <div className="ttt-indicator">{content}</div>;
}

// --- Main App ---
// PUBLIC_INTERFACE
function App() {
  // Theme logic (leave as-is for template toggle)
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Game state
  const [mode, setMode] = useState('PVP'); // 'PVP' or 'AI'
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true); // 'X' always goes first
  const [score, setScore] = useState(loadScore());
  const [status, setStatus] = useState({ winner: null, draw: false, winningLine: [] });

  const squares = history[step];

  // Handle moves
  const handleSquareClick = idx => {
    if (squares[idx] || status.winner || status.draw) return;
    const nxtSquares = squares.slice();
    nxtSquares[idx] = xIsNext ? 'X' : 'O';
    const newHistory = history.slice(0, step + 1).concat([nxtSquares]);
    setHistory(newHistory);
    setStep(newHistory.length - 1);
    setXIsNext(!xIsNext);
  };

  // After every step, evaluate win/draw/status
  useEffect(() => {
    const res = calculateWinner(squares);
    if (res) {
      setStatus({ winner: res.winner, draw: false, winningLine: res.winningLine });
      // Update score
      setScore(scoreNow => {
        const ns = { ...scoreNow, [res.winner]: scoreNow[res.winner] + 1 };
        saveScore(ns);
        return ns;
      });
    } else if (isDraw(squares)) {
      setStatus({ winner: null, draw: true, winningLine: [] });
      setScore(scoreNow => {
        const ns = { ...scoreNow, draw: scoreNow.draw + 1 };
        saveScore(ns);
        return ns;
      });
    } else {
      setStatus({ winner: null, draw: false, winningLine: [] });
    }
    // eslint-disable-next-line
  }, [squares]);

  // Handle restarting the game
  const restartGame = () => {
    setHistory([Array(9).fill(null)]);
    setStep(0);
    setXIsNext(true);
    setStatus({ winner: null, draw: false, winningLine: [] });
  };

  // Switch mode resets game
  const handleModeChange = m => {
    setMode(m);
    restartGame();
  };

  // AI Move effect
  useEffect(() => {
    if (
      mode === 'AI' &&
      !status.winner &&
      !status.draw &&
      !xIsNext // AI is always 'O'
    ) {
      // AI waits a moment to feel natural
      const aiTimeout = setTimeout(() => {
        const aiMove = getAIMove(squares, 'O', 'X');
        if (aiMove !== undefined && squares[aiMove] === null) {
          handleSquareClick(aiMove);
        }
      }, 420); // ~0.4s delay
      return () => clearTimeout(aiTimeout);
    }
    // eslint-disable-next-line
  }, [mode, step, xIsNext, status, squares]);

  // --- Main render ---
  return (
    <div className="App" style={{ background: COLORS.secondary }}>
      <header className="App-header" style={{ minHeight: 'unset', padding: 0 }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <div className="ttt-container">
          <GameHeader mode={mode} setMode={handleModeChange} />
          <Scoreboard score={score} />
          <PlayerIndicator
            xIsNext={xIsNext}
            isGameOver={!!status.winner || status.draw}
            winner={status.winner}
            mode={mode}
          />
          <Board
            squares={squares}
            onSquareClick={i => {
              // In AI mode prevent user click if it's AI's turn
              if (mode === 'AI' && !xIsNext) return;
              handleSquareClick(i);
            }}
            winningLine={status.winningLine}
          />
          <GameControls onRestart={restartGame} mode={mode} setMode={handleModeChange} />
        </div>
        <footer style={{ marginTop: 24, color: "#bbb", fontSize: 13 }}>
          <a href="https://reactjs.org/" className="App-link" target="_blank" rel="noopener noreferrer">
            React
          </a> minimalist template. Theme, design, and logic by KAVIA AI.
        </footer>
      </header>
    </div>
  );
}

export default App;
