import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import BrandbilGame from './games/brandbil/BrandbilGame';
import VaskBilGame from './games/vaskbil/VaskBilGame';
import GravemaskineGame from './games/gravemaskine/GravemaskineGame';
import { GameActiveContext, useGameActiveProvider } from './hooks/useGameActive';
import ErrorBoundary from './components/ErrorBoundary';

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
              <Route path="snake" element={<ErrorBoundary><SnakeGame /></ErrorBoundary>} />
              <Route path="pacman" element={<ErrorBoundary><PacmanGame /></ErrorBoundary>} />
              <Route path="memory" element={<ErrorBoundary><MemoryGame /></ErrorBoundary>} />
              <Route path="jump" element={<ErrorBoundary><JumpGame /></ErrorBoundary>} />
              <Route path="quiz" element={<ErrorBoundary><QuizGame /></ErrorBoundary>} />
              <Route path="toss" element={<ErrorBoundary><TossGame /></ErrorBoundary>} />
              <Route path="run" element={<ErrorBoundary><RunGame /></ErrorBoundary>} />
            </Route>
            <Route path="/maskiner/game" element={<MachinesShell />}>
              <Route path="memory" element={<ErrorBoundary><MachinesMemoryGame /></ErrorBoundary>} />
              <Route path="tractor" element={<ErrorBoundary><TractorGame /></ErrorBoundary>} />
              <Route path="appletree" element={<ErrorBoundary><AppleTreeGame /></ErrorBoundary>} />
              <Route path="brandbil" element={<ErrorBoundary><BrandbilGame /></ErrorBoundary>} />
              <Route path="vaskbil" element={<ErrorBoundary><VaskBilGame /></ErrorBoundary>} />
              <Route path="gravemaskine" element={<ErrorBoundary><GravemaskineGame /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameActiveContext>
      </div>
    </Router>
  );
}

export default App;