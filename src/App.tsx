import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import MachinesHome from './pages/MachinesHome';
import GameShell from './components/GameShell';
import MachinesShell from './components/MachinesShell';
import SnakeGame from './games/snake/SnakeGame';
import PacmanGame from './games/pacman/PacmanGame';
import MemoryGame from './games/memory/MemoryGame';
import JumpGame from './games/jump/JumpGame';
import QuizGame from './games/quiz/QuizGame';
import TossGame from './games/toss/TossGame';
import RunGame from './games/run/RunGame';
import MachinesMemoryGame from './games/machines-memory/MachinesMemoryGame';
import TractorGame from './games/tractor/TractorGame';
import AppleTreeGame from './games/appletree/AppleTreeGame';
import { GameActiveContext, useGameActiveProvider } from './hooks/useGameActive';

function App() {
  const gameActive = useGameActiveProvider();

  return (
    <Router>
      <div className="min-h-screen">
        <GameActiveContext value={gameActive}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pokemon" element={<Home />} />
            <Route path="/maskiner" element={<MachinesHome />} />
            <Route path="/game" element={<GameShell />}>
              <Route path="snake" element={<SnakeGame />} />
              <Route path="pacman" element={<PacmanGame />} />
              <Route path="memory" element={<MemoryGame />} />
              <Route path="jump" element={<JumpGame />} />
              <Route path="quiz" element={<QuizGame />} />
              <Route path="toss" element={<TossGame />} />
              <Route path="run" element={<RunGame />} />
            </Route>
            <Route path="/maskiner/game" element={<MachinesShell />}>
              <Route path="memory" element={<MachinesMemoryGame />} />
              <Route path="tractor" element={<TractorGame />} />
              <Route path="appletree" element={<AppleTreeGame />} />
            </Route>
          </Routes>
        </GameActiveContext>
      </div>
    </Router>
  );
}

export default App;