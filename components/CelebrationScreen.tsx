import React, { useEffect, useState, useRef } from 'react';
import { AnimalDef, UserData } from '../types';
import { generateAnimalImage, generateSpeech, playAudioBuffer, stopAudio } from '../services/geminiService';

interface Props {
  animal: AnimalDef;
  user: UserData;
  onRestart: () => void;
}

export const CelebrationScreen: React.FC<Props> = ({ animal, user, onRestart }) => {
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPerformanceFinished, setIsPerformanceFinished] = useState(false);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const sequence = async () => {
      stopAudio(); // Ensure silence before starting
      
      // 1. Generate Realistic Image
      // Parallelize image generation and audio generation for speed
      const imagePromise = generateAnimalImage(animal.name, "Real Realistic Nature");
      
      // 2. Generate Sounds
      // The animal sound (e.g., "Roar")
      const soundEffectPromise = generateSpeech(animal.finalSound, 'Fenrir');
      
      const speechText = `I am fully grown now! Look at me! I am a real ${animal.name}. Thank you ${user.name} for taking care of me. You are my best friend!`;
      const finalVoice = animal.stages[animal.stages.length - 1].voice;
      const speechPromise = generateSpeech(speechText, finalVoice);

      const [imgUrl, soundBuffer, speechBuffer] = await Promise.all([
        imagePromise,
        soundEffectPromise,
        speechPromise
      ]);

      if (mounted) {
        if (imgUrl) setFinalImage(imgUrl);
        setLoading(false);

        // Play Sound Sequence
        if (!audioPlayedRef.current) {
          audioPlayedRef.current = true;
          
          if (soundBuffer) {
             await playAudioBuffer(soundBuffer);
             
             // Small pause between roar and speech
             await new Promise(r => setTimeout(r, 800)); 

             if (speechBuffer && mounted) {
                await playAudioBuffer(speechBuffer);
             }
          } else if (speechBuffer) {
              await playAudioBuffer(speechBuffer);
          }
          
          if (mounted) {
              setIsPerformanceFinished(true);
          }
        }
      }
    };

    sequence();

    return () => {
      mounted = false;
      stopAudio();
    };
  }, [animal, user.name]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-blue-900 to-purple-900 relative overflow-hidden">
        
        <div className="z-10 w-full max-w-4xl flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-8 animate-pop-in drop-shadow-lg">
                Congratulations!
            </h1>

            <div className="relative w-full max-w-lg aspect-square mb-8 rounded-[3rem] border-8 border-white/20 shadow-2xl bg-black/30 overflow-hidden flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-white font-medium text-lg animate-pulse">Summoning real {animal.name}...</p>
                    </div>
                ) : (
                    finalImage ? (
                        <img 
                            src={finalImage} 
                            alt={`Real ${animal.name}`} 
                            className="w-full h-full object-cover animate-pop-in"
                        />
                    ) : (
                        <div className="text-9xl animate-bounce">
                           {animal.stages[animal.stages.length - 1].emoji}
                        </div>
                    )
                )}
            </div>

            <p className="text-2xl md:text-3xl text-white mb-12 max-w-2xl font-medium leading-relaxed drop-shadow-md">
                <span className="text-yellow-300 font-bold">{user.name}</span>, you raised a happy and healthy {animal.name}!
            </p>

            <button 
                onClick={onRestart}
                disabled={!isPerformanceFinished}
                className={`
                    px-12 py-5 rounded-full text-2xl font-bold shadow-[0_0_40px_rgba(52,211,153,0.5)] transform transition-all
                    ${isPerformanceFinished 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 hover:scale-105 text-white cursor-pointer' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50 scale-100'}
                `}
            >
                {isPerformanceFinished ? "Play Again 🔄" : "Wait for it..."}
            </button>
        </div>
    </div>
  );
};