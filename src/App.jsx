import { useState, useEffect, useCallback } from 'react';
import { questionsData } from './data/questions';
import { soundManager } from './utils/sounds';
import './App.css';

// Initial empty 5x5 board
const createEmptyBoard = () => Array(5).fill(null).map(() => Array(5).fill(null));

function App() {
  const [gameState, setGameState] = useState('start'); // start, playing, question, result, gameOver
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentTeam, setCurrentTeam] = useState('X');
  const [selectedCell, setSelectedCell] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [animatingCells, setAnimatingCells] = useState([]);
  const [history, setHistory] = useState([]); // History stack for undo

  // Check win condition
  const checkWin = useCallback((boardState, symbol) => {
    // Check rows
    for (let i = 0; i < 5; i++) {
      if (boardState[i].every(cell => cell === symbol)) return true;
    }
    // Check columns
    for (let j = 0; j < 5; j++) {
      if (boardState.every(row => row[j] === symbol)) return true;
    }
    // Check diagonals
    if (boardState.every((row, i) => row[i] === symbol)) return true;
    if (boardState.every((row, i) => row[4 - i] === symbol)) return true;
    return false;
  }, []);

  // Check if board is full
  const isBoardFull = useCallback((boardState) => {
    return boardState.every(row => row.every(cell => cell !== null));
  }, []);

  // Count scores
  const countScores = useCallback((boardState) => {
    let xCount = 0, oCount = 0;
    boardState.forEach(row => {
      row.forEach(cell => {
        if (cell === 'X') xCount++;
        if (cell === 'O') oCount++;
      });
    });
    return { X: xCount, O: oCount };
  }, []);

  // Start game
  const startGame = () => {
    soundManager.playStart();
    setBoard(createEmptyBoard());
    setCurrentTeam('X');
    setGameState('playing');
    setWinner(null);
    setScores({ X: 0, O: 0 });
    setAnimatingCells([]);
    setHistory([]); // Clear history
  };

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (gameState !== 'playing' || board[row][col] !== null) return;
    
    soundManager.playCellSelect();
    setSelectedCell({ row, col });
    const questionIndex = row * 5 + col;
    setCurrentQuestion(questionsData[questionIndex]);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameState('question');
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    soundManager.playClick();
    setSelectedAnswer(answer);
  };

  // Submit answer
  const submitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const correct = selectedAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }
  };

  // Continue after seeing result
  const continueGame = () => {
    const { row, col } = selectedCell;
    
    // Save current state to history before making changes
    setHistory(prev => [...prev, {
      board: board.map(r => [...r]),
      currentTeam,
      scores: { ...scores }
    }]);
    
    const newBoard = board.map(r => [...r]);
    
    // Mark cell based on answer correctness
    const mark = isCorrect ? currentTeam : (currentTeam === 'X' ? 'O' : 'X');
    newBoard[row][col] = mark;
    
    // Add animation
    setAnimatingCells([{ row, col, mark }]);
    setTimeout(() => setAnimatingCells([]), 500);
    
    setBoard(newBoard);
    
    // Update scores
    const newScores = countScores(newBoard);
    setScores(newScores);
    
    // Check for winner
    if (checkWin(newBoard, 'X')) {
      setWinner('X');
      setGameState('gameOver');
      soundManager.playVictory();
      return;
    }
    if (checkWin(newBoard, 'O')) {
      setWinner('O');
      setGameState('gameOver');
      soundManager.playVictory();
      return;
    }
    
    // Check for full board
    if (isBoardFull(newBoard)) {
      if (newScores.X > newScores.O) setWinner('X');
      else if (newScores.O > newScores.X) setWinner('O');
      else setWinner('draw');
      setGameState('gameOver');
      if (newScores.X === newScores.O) {
        soundManager.playDraw();
      } else {
        soundManager.playVictory();
      }
      return;
    }
    
    // Switch turns
    const nextTeam = currentTeam === 'X' ? 'O' : 'X';
    setCurrentTeam(nextTeam);
    soundManager.playTurnChange();
    setGameState('playing');
    setCurrentQuestion(null);
    setSelectedCell(null);
  };

  // Undo last move
  const undoLastMove = () => {
    if (history.length === 0) return;
    
    soundManager.playClick();
    
    const lastState = history[history.length - 1];
    setBoard(lastState.board);
    setCurrentTeam(lastState.currentTeam);
    setScores(lastState.scores);
    setHistory(prev => prev.slice(0, -1));
    setGameState('playing');
    setWinner(null);
  };

  // Render star decorations
  const renderStars = () => {
    return (
      <div className="stars-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`star star-${i + 1}`}>★</div>
        ))}
      </div>
    );
  };

  // Render board
  const renderBoard = () => (
    <div className="board-container">
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              const isAnimating = animatingCells.some(
                c => c.row === rowIndex && c.col === colIndex
              );
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              
              return (
                <button
                  key={colIndex}
                  className={`cell ${cell ? 'occupied' : 'empty'} ${cell === 'X' ? 'cell-x' : ''} ${cell === 'O' ? 'cell-o' : ''} ${isAnimating ? 'animating' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={cell !== null || gameState !== 'playing'}
                >
                  {cell && (
                    <span className="cell-mark">{cell}</span>
                  )}
                  {!cell && (
                    <span className="cell-number">{rowIndex * 5 + colIndex + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // Close question modal (cancel selection)
  const closeQuestionModal = () => {
    soundManager.playClick();
    setGameState('playing');
    setCurrentQuestion(null);
    setSelectedCell(null);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Render question modal
  const renderQuestionModal = () => {
    if (!currentQuestion) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal question-modal">
          {!showResult && (
            <button className="modal-close-btn" onClick={closeQuestionModal} title="Đóng">
              ✕
            </button>
          )}
          <div className="modal-header">
            <div className="team-indicator">
              <span className={`team-badge ${currentTeam === 'X' ? 'team-x' : 'team-o'}`}>
                ĐỘI {currentTeam}
              </span>
            </div>
            <h2>📜 Câu Hỏi</h2>
          </div>
          
          <div className="question-content">
            <p className="question-text">{currentQuestion.question}</p>
            
            <div className="options">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = option.charAt(0);
                const isSelected = selectedAnswer === optionLetter;
                const isCorrectAnswer = showResult && optionLetter === currentQuestion.answer;
                const isWrongSelected = showResult && isSelected && !isCorrect;
                
                return (
                  <button
                    key={index}
                    className={`option ${isSelected ? 'selected' : ''} ${isCorrectAnswer ? 'correct' : ''} ${isWrongSelected ? 'wrong' : ''}`}
                    onClick={() => !showResult && handleAnswerSelect(optionLetter)}
                    disabled={showResult}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {showResult && (
              <div className={`result-section ${isCorrect ? 'correct' : 'wrong'}`}>
                <div className="result-icon">
                  {isCorrect ? '✓' : '✗'}
                </div>
                <h3>{isCorrect ? 'CHÍNH XÁC!' : 'SAI RỒI!'}</h3>
                <p className="result-message">
                  {isCorrect 
                    ? `Đội ${currentTeam} ghi được dấu ${currentTeam}!`
                    : `Ô này bị đánh dấu ${currentTeam === 'X' ? 'O' : 'X'}!`
                  }
                </p>
                <div className="explanation">
                  <strong>📖 Giải thích:</strong>
                  <p>{currentQuestion.explanation}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            {!showResult ? (
              <button 
                className="btn btn-primary"
                onClick={submitAnswer}
                disabled={!selectedAnswer}
              >
                ✔ Xác Nhận
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={continueGame}
              >
                ▶ Tiếp Tục
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render game over modal
  const renderGameOverModal = () => {
    const isDraw = winner === 'draw';
    
    return (
      <div className="modal-overlay victory-overlay">
        <div className="modal victory-modal">
          <div className="victory-decoration">
            <div className="victory-star">★</div>
            <div className="victory-rays"></div>
          </div>
          
          <h1 className="victory-title">
            {isDraw ? '🤝 HÒA!' : '🎉 CHIẾN THẮNG!'}
          </h1>
          
          {!isDraw && (
            <div className={`winner-badge ${winner === 'X' ? 'winner-x' : 'winner-o'}`}>
              <span className="winner-mark">{winner}</span>
              <span className="winner-text">ĐỘI {winner}</span>
            </div>
          )}
          
          <div className="final-scores">
            <div className="score-card score-x">
              <span className="score-label">Đội X</span>
              <span className="score-value">{scores.X}</span>
            </div>
            <div className="score-divider">-</div>
            <div className="score-card score-o">
              <span className="score-label">Đội O</span>
              <span className="score-value">{scores.O}</span>
            </div>
          </div>
          
          <div className="victory-quote">
            "Đoàn kết, đoàn kết, đại đoàn kết!<br/>
            Thành công, thành công, đại thành công!"
          </div>
          
          <button className="btn btn-victory" onClick={startGame}>
            🔄 Chơi Lại
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {renderStars()}
      
      <div className="decorative-banner top-banner">
        <span>★</span>
      </div>
      
      <header className="header">
        <div className="vietnam-flag">
          <div className="flag-star">★</div>
        </div>
        <h1 className="title">CỜ CARO TRẮC NGHIỆM</h1>
        <h2 className="subtitle">TƯ TƯỞNG HỒ CHÍ MINH</h2>
        <div className="header-stars">★ ★ ★ ★ ★</div>
      </header>

      {gameState === 'start' && (
        <div className="start-screen">
          <div className="start-content">
            <div className="start-icon">📚</div>
            <h2>Chào Mừng Các Đồng Chí!</h2>
            <p className="start-description">
              Trò chơi kết hợp cờ Caro 5x5 với các câu hỏi trắc nghiệm về tư tưởng Hồ Chí Minh.
              Trả lời đúng để đánh dấu ô, trả lời sai thì đối phương được điểm!
            </p>
            <div className="rules">
              <h3>📋 Luật Chơi:</h3>
              <ul>
                <li>🎯 Hai đội X và O lần lượt chọn ô</li>
                <li>📝 Trả lời câu hỏi để chiếm ô</li>
                <li>✓ Đúng: Ghi dấu của đội mình</li>
                <li>✗ Sai: Đối phương được ghi dấu</li>
                <li>🏆 Thắng: 5 ô liên tiếp hoặc nhiều ô hơn khi hết bàn</li>
              </ul>
            </div>
            <button className="btn btn-start" onClick={startGame}>
              🚀 BẮT ĐẦU TRẬN ĐẤU
            </button>
          </div>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'question') && (
        <main className="game-main">
          <div className="game-info">
            <div className="turn-indicator">
              <span className="turn-label">Lượt Của:</span>
              <span className={`turn-team ${currentTeam === 'X' ? 'team-x' : 'team-o'}`}>
                ĐỘI {currentTeam}
              </span>
            </div>
            
            <div className="scoreboard">
              <div className={`score-panel team-x-panel ${currentTeam === 'X' ? 'active' : ''}`}>
                <div className="score-team-name">ĐỘI X</div>
                <div className="score-number">{scores.X}</div>
                <div className="score-star">★</div>
              </div>
              
              <div className="score-vs">
                <span className="vs-text">VS</span>
                <div className="vs-decoration"></div>
              </div>
              
              <div className={`score-panel team-o-panel ${currentTeam === 'O' ? 'active' : ''}`}>
                <div className="score-team-name">ĐỘI O</div>
                <div className="score-number">{scores.O}</div>
                <div className="score-star">★</div>
              </div>
            </div>
          </div>

          {renderBoard()}
          
          <p className="instruction">
            {gameState === 'playing' 
              ? '👆 Chọn một ô trống để trả lời câu hỏi!' 
              : '📝 Đang trả lời câu hỏi...'}
          </p>
        </main>
      )}

      {gameState === 'question' && renderQuestionModal()}
      {gameState === 'gameOver' && renderGameOverModal()}

      {/* Undo Button - Fixed Bottom Right */}
      {(gameState === 'playing' || gameState === 'question' || gameState === 'gameOver') && history.length > 0 && (
        <button className="btn btn-undo-fixed" onClick={undoLastMove}>
          ↩ Hoàn Tác ({history.length})
        </button>
      )}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-credit">✦ Nhóm 2 - Môn HCM202 SPRING 2025 ✦</div>
          <span>★ Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh ★</span>
        </div>
      </footer>
      
      <div className="decorative-banner bottom-banner">
        <span>★</span>
      </div>
    </div>
  );
}

export default App;
