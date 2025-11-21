import React, { useState } from 'react';
import { GameState, AnimalType, UserData } from './types';
import { ANIMALS } from './constants';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EggSelection } from './components/EggSelection';
import { GameScreen } from './components/GameScreen';
import { generateSpeech, playAudioBuffer, stopAudio } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalType | null>(null);

  const startApp = (data: UserData) => {
    setUser(data);
    setGameState(GameState.SELECT_EGG);
  };

  const selectEgg = (id: AnimalType) => {
    setSelectedAnimalId(id);
    setGameState(GameState.HATCHING);
    
    // Simulated Hatching Sequence
    setTimeout(() => {
      setGameState(GameState.PLAYING);
    }, 2500);
  };

  const handleWin = () => {
    setGameState(GameState.CELEBRATION);
    // Final speech
    if (selectedAnimalId && user) {
        const animal = ANIMALS[selectedAnimalId];
        const finalVoice = animal.stages[animal.stages.length -1].voice;
        setTimeout(async () => {
            const buff = await generateSpeech(`I am fully grown now! Thank you ${user.name} for taking care of me. You are my best friend!`, finalVoice);
            if(buff) playAudioBuffer(buff);
        }, 1000);
    }
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
        return <EggSelection onSelect={selectEgg} />;
      
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
          />
        );

      case GameState.CELEBRATION:
        const finalAnimal = selectedAnimalId ? ANIMALS[selectedAnimalId] : null;
        const finalEmoji = finalAnimal?.stages[finalAnimal.stages.length - 1].emoji;
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-blue-200 to-purple-200">
                <div className="text-[12rem] animate-bounce-slow mb-4 filter drop-shadow-2xl">
                    {finalEmoji}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-purple-600 mb-4 animate-pop-in">
                    Congratulations!
                </h1>
                <p className="text-2xl text-gray-700 mb-12 max-w-lg mx-auto">
                    {user?.name}, you raised a happy and healthy {finalAnimal?.name}!
                </p>
                <button 
                    onClick={resetGame}
                    className="bg-white text-purple-600 px-10 py-4 rounded-full text-2xl font-bold shadow-xl hover:bg-purple-50 transition-colors"
                >
                    Play Again 🔄
                </button>
            </div>
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