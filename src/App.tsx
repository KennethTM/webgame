import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameShell from './components/GameShell';
import SnakeGame from './games/snake/SnakeGame';
import PacmanGame from './games/pacman/PacmanGame';
import MemoryGame from './games/memory/MemoryGame';
import JumpGame from './games/jump/JumpGame';
import QuizGame from './games/quiz/QuizGame';
import TossGame from './games/toss/TossGame';
import RunGame from './games/run/RunGame';
import { GameActiveContext, useGameActiveProvider } from './hooks/useGameActive';

function App() {
  const gameActive = useGameActiveProvider();

  return (
    <Router>
      <div className="min-h-screen">
        <GameActiveContext value={gameActive}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<GameShell />}>
              <Route path="snake" element={<SnakeGame />} />
              <Route path="pacman" element={<PacmanGame />} />
              <Route path="memory" element={<MemoryGame />} />
              <Route path="jump" element={<JumpGame />} />
              <Route path="quiz" element={<QuizGame />} />
              <Route path="toss" element={<TossGame />} />
              <Route path="run" element={<RunGame />} />
            </Route>
          </Routes>
        </GameActiveContext>
      </div>
    </Router>
  );
}

export default App;