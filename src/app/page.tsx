'use client';

import { useState, useEffect, useCallback } from 'react';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];

interface GameRecord {
  id: number;
  winner: string;
  board: string;
  createdAt: string;
}

interface GameStats {
  x: number;
  o: number;
  draw: number;
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function calculateWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player; line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [stats, setStats] = useState<GameStats>({ x: 0, o: 0, draw: 0 });
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveGame = useCallback(async (winner: string, finalBoard: Board) => {
    setSaving(true);
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner, board: finalBoard }),
      });
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save game:', err);
    } finally {
      setSaving(false);
    }
  }, [fetchHistory]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinnerInfo(result);
      setGameOver(true);
      setStats(prev => ({
        ...prev,
        [result.winner.toLowerCase()]: prev[result.winner.toLowerCase() as keyof GameStats] + 1,
      }));
      saveGame(result.winner, newBoard);
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setGameOver(true);
      setStats(prev => ({ ...prev, draw: prev.draw + 1 }));
      saveGame('Draw', newBoard);
      return;
    }

    setCurrentPlayer(prev => (prev === 'X' ? 'O' : 'X'));
  }, [board, currentPlayer, gameOver, saveGame]);

  const handleNewGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setWinnerInfo(null);
    setIsDraw(false);
  }, []);

  const getStatusText = () => {
    if (winnerInfo) return `Player ${winnerInfo.winner} wins! 🎉`;
    if (isDraw) return "It's a draw! 🤝";
    return `Player ${currentPlayer}'s turn`;
  };

  const getStatusClass = () => {
    if (winnerInfo) return `status-bar status-win status-${winnerInfo.winner.toLowerCase()}`;
    if (isDraw) return 'status-bar status-draw';
    return `status-bar status-${currentPlayer.toLowerCase()}`;
  };

  const isWinnerCell = (index: number) => winnerInfo?.line.includes(index) ?? false;

  const getCellClass = (index: number) => {
    const val = board[index];
    let cls = 'cell';
    if (val) cls += ' cell-filled';
    if (!val && gameOver) cls += ' cell-disabled';
    if (val === 'X') cls += ' cell-x';
    if (val === 'O') cls += ' cell-o';
    if (isWinnerCell(index)) cls += ' cell-winner';
    return cls;
  };

  return (
    <main className="container">
      <div className="header">
        <h1>Tic Tac Toe</h1>
        <p>Two-player strategy game</p>
      </div>

      <div className="game-section">
        <div className="score-board">
          <div className="score-card score-x">
            <div className="score-label">Player X</div>
            <div className="score-value">{stats.x}</div>
          </div>
          <div className="score-card score-draw">
            <div className="score-label">Draws</div>
            <div className="score-value">{stats.draw}</div>
          </div>
          <div className="score-card score-o">
            <div className="score-label">Player O</div>
            <div className="score-value">{stats.o}</div>
          </div>
        </div>

        <div className={getStatusClass()}>
          {getStatusText()}
          {saving && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.7 }}>saving...</span>}
        </div>

        <div className="board">
          {board.map((cell, i) => (
            <button
              key={i}
              className={getCellClass(i)}
              onClick={() => handleCellClick(i)}
              disabled={!!cell || gameOver}
              aria-label={`Cell ${i + 1}${cell ? ` - ${cell}` : ''}`}
            >
              {cell}
            </button>
          ))}
        </div>

        <button className="new-game-btn" onClick={handleNewGame}>
          New Game
        </button>
      </div>

      <div className="history-section">
        <h2>
          🕹️ Game History
          <button className="refresh-btn" onClick={fetchHistory} disabled={historyLoading}>
            {historyLoading ? 'Loading...' : 'Refresh'}
          </button>
        </h2>

        {historyLoading && history.length === 0 ? (
          <div className="loading">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="history-empty">No games played yet. Start a game above!</div>
        ) : (
          <div className="history-list">
            {history.map((record) => {
              let parsedBoard: Cell[] = Array(9).fill(null);
              try {
                parsedBoard = JSON.parse(record.board);
              } catch {}
              const winnerClass = record.winner === 'X'
                ? 'history-winner history-winner-x'
                : record.winner === 'O'
                ? 'history-winner history-winner-o'
                : 'history-winner history-winner-draw';

              return (
                <div key={record.id} className="history-item">
                  <div className={winnerClass}>
                    {record.winner === 'Draw' ? '🤝 Draw' : `🏆 ${record.winner} wins`}
                  </div>
                  <div className="history-meta">
                    <div className="history-board">
                      {parsedBoard.map((c, i) => (
                        <div
                          key={i}
                          className={`history-cell${c === 'X' ? ' history-cell-x' : c === 'O' ? ' history-cell-o' : ''}`}
                        >
                          {c || ''}
                        </div>
                      ))}
                    </div>
                    <div className="history-time">{formatDate(record.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
