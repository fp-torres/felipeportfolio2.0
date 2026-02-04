import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export default function SnakeGame({ onBack }) {
  const { t } = useLanguage();
  
  // Configurações do Tabuleiro
  const GRID_SIZE = 20;
  const SPEED = 150;
  
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0); // Estado para o Recorde
  const [isPaused, setIsPaused] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false); // Efeito visual de novo recorde
  
  const gameLoopRef = useRef();

  // 1. Carregar o Recorde ao iniciar
  useEffect(() => {
    const savedScore = localStorage.getItem('snakeHighScore');
    if (savedScore) {
      setHighScore(parseInt(savedScore));
    }
  }, []);

  // Função para gerar comida aleatória
  const generateFood = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  };

  // 2. Controles de Teclado (COM PREVENT DEFAULT para não rolar a tela)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Lista de teclas usadas no jogo
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      // Se a tecla apertada for uma das setas, bloqueia o scroll da página
      if (gameKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      moveSnake();
    }, SPEED);

    return () => clearInterval(gameLoopRef.current);
  }, [snake, direction, gameOver, isPaused]);

  const moveSnake = () => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Verificar Colisão (Parede ou Próprio corpo)
    if (
      head.x < 0 || head.x >= GRID_SIZE || 
      head.y < 0 || head.y >= GRID_SIZE ||
      newSnake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      handleGameOver();
      return;
    }

    newSnake.unshift(head);

    // Verificar se comeu
    if (head.x === food.x && head.y === food.y) {
      const newScore = score + 10;
      setScore(newScore);
      
      // Atualizar Recorde em Tempo Real
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('snakeHighScore', newScore.toString());
        if (!isNewRecord) setIsNewRecord(true); // Ativa flag para animação
      }

      setFood(generateFood());
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const handleGameOver = () => {
    setGameOver(true);
  };

  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setIsNewRecord(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-surface/30 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl relative">
      
      {/* Header do Jogo */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2 transition-colors text-sm font-bold">
          <Icon icon="solar:arrow-left-bold" /> Sair
        </button>
        
        {/* Placar */}
        <div className="flex gap-4">
            <div className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                Score: <span className="text-primary font-bold">{score}</span>
            </div>
            <div className={`text-white font-mono text-sm px-3 py-1 rounded-lg border transition-all ${isNewRecord ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 animate-pulse' : 'bg-black/30 border-white/5'}`}>
                Record: <span className="font-bold">{highScore}</span>
            </div>
        </div>

        <button onClick={() => !gameOver && setIsPaused(!isPaused)} className="text-white hover:text-primary transition-colors">
          <Icon icon={isPaused ? "solar:play-bold" : "solar:pause-bold"} width="24" />
        </button>
      </div>

      {/* Área do Jogo */}
      <div className="relative aspect-square bg-black/40 rounded-xl border border-white/20 overflow-hidden mx-auto max-w-[300px] sm:max-w-[400px] shadow-inner">
        
        {/* Renderização da Cobrinha e Comida */}
        {Array.from({ length: GRID_SIZE }).map((_, row) => (
          <div key={row} className="flex h-[5%]">
            {Array.from({ length: GRID_SIZE }).map((_, col) => {
              const isSnake = snake.some(s => s.x === col && s.y === row);
              const isFood = food.x === col && food.y === row;
              const isHead = snake[0].x === col && snake[0].y === row;

              return (
                <div 
                  key={`${row}-${col}`} 
                  className={`w-[5%] h-full transition-all duration-100
                    ${isHead ? 'bg-primary rounded-sm z-10 scale-110' : ''}
                    ${isSnake && !isHead ? 'bg-green-500/50 rounded-sm' : ''}
                    ${isFood ? 'bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : ''}
                  `}
                />
              );
            })}
          </div>
        ))}

        {/* Overlay Pausa */}
        {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                <Icon icon="solar:pause-circle-bold" className="text-white text-6xl opacity-80" />
            </div>
        )}

        {/* Overlay Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
            <h3 className="text-3xl font-bold text-red-500 mb-2">Game Over!</h3>
            
            {isNewRecord && (
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2 animate-bounce">Novo Recorde!</span>
            )}

            <p className="text-gray-300 mb-6 font-mono">Pontuação: <span className="text-white font-bold text-xl">{score}</span></p>
            
            <button 
                onClick={restartGame} 
                className="bg-primary text-bg px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,209,0,0.3)]"
            >
              <Icon icon="solar:restart-bold" /> Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Controles Mobile */}
      <div className="mt-8 grid grid-cols-3 gap-2 max-w-[180px] mx-auto md:hidden">
        <div />
        <button 
            onTouchStart={(e) => { e.preventDefault(); if (direction !== 'DOWN') setDirection('UP'); }} 
            onClick={() => direction !== 'DOWN' && setDirection('UP')}
            className="bg-white/10 p-4 rounded-2xl active:bg-primary active:text-bg transition-colors"
        >
            <Icon icon="solar:arrow-up-bold" className="text-white text-xl" />
        </button>
        <div />
        
        <button 
            onTouchStart={(e) => { e.preventDefault(); if (direction !== 'RIGHT') setDirection('LEFT'); }}
            onClick={() => direction !== 'RIGHT' && setDirection('LEFT')} 
            className="bg-white/10 p-4 rounded-2xl active:bg-primary active:text-bg transition-colors"
        >
            <Icon icon="solar:arrow-left-bold" className="text-white text-xl" />
        </button>
        
        <button 
            onTouchStart={(e) => { e.preventDefault(); if (direction !== 'UP') setDirection('DOWN'); }}
            onClick={() => direction !== 'UP' && setDirection('DOWN')} 
            className="bg-white/10 p-4 rounded-2xl active:bg-primary active:text-bg transition-colors"
        >
            <Icon icon="solar:arrow-down-bold" className="text-white text-xl" />
        </button>
        
        <button 
            onTouchStart={(e) => { e.preventDefault(); if (direction !== 'LEFT') setDirection('RIGHT'); }}
            onClick={() => direction !== 'LEFT' && setDirection('RIGHT')} 
            className="bg-white/10 p-4 rounded-2xl active:bg-primary active:text-bg transition-colors"
        >
            <Icon icon="solar:arrow-right-bold" className="text-white text-xl" />
        </button>
      </div>
      
      <p className="text-center text-xs text-gray-500 mt-6 hidden md:block">
        Use as <span className="text-primary font-bold">Setas do Teclado</span> para mover
      </p>
    </div>
  );
}