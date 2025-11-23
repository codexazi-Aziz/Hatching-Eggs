import React, { useState } from 'react';
import { GameState, AnimalType, UserData } from './types';
import { ANIMALS } from './constants';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EggSelection } from './components/EggSelection';
import { GameScreen } from './components/GameScreen';
import { CelebrationScreen } from './components/CelebrationScreen';
import { stopAudio, generateSpeech, playAudioBuffer } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalType | null>(null);

  const startApp = (data: UserData) => {
    setUser(data);
    setGameState(GameState.SELECT_EGG);
  };

  const selectEgg = async (id: AnimalType) => {
    setSelectedAnimalId(id);
    setGameState(GameState.HATCHING);
    
    // Play hatching sound
    try {
        const soundBuffer = await generateSpeech("Crack! Crackle! Pop! Hello world!", 'Puck');
        if (soundBuffer) {
            playAudioBuffer(soundBuffer);
        }
    } catch (e) {
        console.error("Failed to play hatching sound", e);
    }

    // Simulated Hatching Sequence
    setTimeout(() => {
      setGameState(GameState.PLAYING);
    }, 4000); // Increased time slightly to allow sound to play
  };

  const handleWin = () => {
    setGameState(GameState.CELEBRATION);
  };

  const resetGame = () => {
    stopAudio();
    setGameState(GameState.WELCOME);
    setUser(null);
    setSelectedAnimalId(null);
  };

  // Render Helpers
  const renderContent = () => {
    switch (gameState) {
      case GameState.WELCOME:
        return <WelcomeScreen onStart={startApp} />;
      
      case GameState.SELECT_EGG:
        return <EggSelection onSelect={selectEgg} onBack={resetGame} />;
      
      case GameState.HATCHING:
        const animal = selectedAnimalId ? ANIMALS[selectedAnimalId] : null;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="animate-shake text-9xl mb-8">
              {animal?.eggEmoji || '🥚'}
            </div>
            <h2 className="text-3xl font-bold text-blue-600 animate-pulse">Hatching...</h2>
          </div>
        );

      case GameState.PLAYING:
        if (!selectedAnimalId || !user) return null;
        return (
          <GameScreen 
            animal={ANIMALS[selectedAnimalId]} 
            user={user} 
            onWin={handleWin} 
            onExit={resetGame}
          />
        );

      case GameState.CELEBRATION:
        if (!selectedAnimalId || !user) return null;
        return (
            <CelebrationScreen 
                animal={ANIMALS[selectedAnimalId]}
                user={user}
                onRestart={resetGame}
            />
        );
        
      default:
        return <div>Error</div>;
    }
  };

  return (
    <div className="w-full h-full font-fredoka text-gray-800">
      {renderContent()}
    </div>
  );
}