import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimalDef, UserData, Question } from '../types';
import { generateQuestion, generateSpeech, playAudioBuffer, generateAnimalImage, stopAudio } from '../services/geminiService';
import { TOTAL_STAGES } from '../constants';

interface Props {
  animal: AnimalDef;
  user: UserData;
  onWin: () => void;
  onExit: () => void;
}

export const GameScreen: React.FC<Props> = ({ animal, user, onWin, onExit }) => {
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Track if the user is currently viewing the question
  const isQuestionActiveRef = useRef(false);

  // Image State
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Audio Pre-fetching State
  const [successAudio, setSuccessAudio] = useState<AudioBuffer | null>(null);
  const [failureAudio, setFailureAudio] = useState<AudioBuffer | null>(null);

  const currentStageDef = animal.stages[stage];

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      isQuestionActiveRef.current = false;
    };
  }, []);

  // Play audio helper with UI blocking
  const speak = useCallback(async (text: string, overrideVoice?: string) => {
    const voice = overrideVoice || currentStageDef.voice;
    setIsAudioPlaying(true);
    const buffer = await generateSpeech(text, voice);
    if (buffer) {
        await playAudioBuffer(buffer);
    }
    setIsAudioPlaying(false);
  }, [currentStageDef.voice]);

  // Load Image for Stage
  useEffect(() => {
    let mounted = true;
    const fetchImage = async () => {
        setImageLoading(true);
        setGeneratedImageUrl(null);
        // This now uses the cache in geminiService automatically
        const url = await generateAnimalImage(animal.name, currentStageDef.title);
        if (mounted && url) {
            setGeneratedImageUrl(url);
        }
        if (mounted) setImageLoading(false);
    };
    fetchImage();
    return () => { mounted = false; };
  }, [stage, animal.name, currentStageDef.title]);

  // Initial Hatching Greeting
  useEffect(() => {
    const init = async () => {
        if (!introPlayed) {
          setIntroPlayed(true);
          const greeting = `Hello ${user.name}. I am your new friend! Can you help me grow?`;
          await speak(greeting, 'Puck'); 
          loadQuestion();
        }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestion = async () => {
    setLoading(true);
    isQuestionActiveRef.current = true;
    
    setSuccessAudio(null);
    setFailureAudio(null);
    setCurrentQuestion(null);

    // 1. Generate Question Text
    const q = await generateQuestion(animal.name, user.age, stage);
    
    // 2. Generate Audio
    let questionAudio: AudioBuffer | null = null;
    if (q) {
        questionAudio = await generateSpeech(q.questionText, currentStageDef.voice);
    }
    
    // 3. Show Text and Play Audio
    setCurrentQuestion(q);
    setLoading(false);
    
    if (questionAudio && isQuestionActiveRef.current) {
        setIsAudioPlaying(true);
        await playAudioBuffer(questionAudio);
        setIsAudioPlaying(false);
    }

    // 4. Load Feedback Audio in Background
    if (q) {
       const voice = currentStageDef.voice;
       
       const correctOptionText = q.options[q.correctAnswerIndex];
       const successText = `Correct! ${correctOptionText}. ${q.explanation}`;
       generateSpeech(successText, voice).then(buff => setSuccessAudio(buff));

       const failureText = "Oh no, that is not right. Try again!";
       generateSpeech(failureText, voice).then(buff => setFailureAudio(buff));
    }
  };

  const handleAnswer = async (index: number) => {
    if (selectedOption !== null || isAudioPlaying) return; 
    
    // Stop question audio logic is handled by UI lock, but strict safe guard:
    isQuestionActiveRef.current = false;
    stopAudio(); 

    setSelectedOption(index);
    
    const correct = index === currentQuestion?.correctAnswerIndex;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    setIsAudioPlaying(true); // Lock Next button while feedback plays

    if (correct) {
      if (successAudio) {
        await playAudioBuffer(successAudio);
      } else {
         const answerName = currentQuestion?.options[index] || "";
         await speak(`Correct! ${answerName}. ${currentQuestion?.explanation || "Good job!"}`);
      }
    } else {
      if (failureAudio) {
        await playAudioBuffer(failureAudio);
      } else {
        await speak("Oh no, that is not right. Try again!");
      }
    }
    
    setIsAudioPlaying(false); // Unlock Next button
  };

  const handleNext = () => {
    if (isAudioPlaying) return;

    if (isCorrect) {
      if (stage + 1 >= TOTAL_STAGES) {
        onWin();
      } else {
        setIsGrowing(true);
        setShowFeedback(false);
        setSelectedOption(null);
        setIsCorrect(null);
        stopAudio();
        
        setTimeout(() => {
           setStage(prev => prev + 1);
           setIsGrowing(false);
        }, 1500);
      }
    } else {
        // Try again logic
        setShowFeedback(false);
        setSelectedOption(null);
        setIsCorrect(null);
        stopAudio();
    }
  };
  
  // Announce growth
  useEffect(() => {
    if (introPlayed && stage > 0 && stage < TOTAL_STAGES) {
        const growSequence = async () => {
            const growTexts = [
                "Yay! I am bigger!", 
                "Wow, look at me grow!", 
                "I am getting taller!",
                "I am stronger now!",
                "Getting bigger every day!",
                "Almost grown up!",
                "I feel so powerful!"
            ];
            
            // Short delay for visual update
            await new Promise(r => setTimeout(r, 500));
            
            const textToSpeak = growTexts[Math.min(stage - 1, growTexts.length - 1)];
            await speak(textToSpeak, currentStageDef.voice);
            loadQuestion();
        };
        
        growSequence();
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);


  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden">
      <button 
        onClick={onExit}
        className="absolute top-4 right-4 bg-white/80 hover:bg-red-100 text-red-500 font-bold px-4 py-2 rounded-full shadow-lg border-2 border-red-100 transition-all z-50 text-sm md:text-base"
        aria-label="Exit Game"
      >
        Exit ❌
      </button>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl bg-white/50 rounded-full h-4 mb-4 mt-12 md:mt-4">
        <div 
          className="bg-green-500 h-4 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${((stage) / TOTAL_STAGES) * 100}%` }}
        ></div>
      </div>

      {/* Animal Display */}
      <div className="flex flex-col items-center mb-6">
         <div className="text-2xl font-bold text-indigo-600 mb-2 drop-shadow-sm bg-white/80 px-4 py-1 rounded-full">
            {currentStageDef.title}
         </div>
         
         <div className={`relative transition-all duration-1000 ease-in-out transform flex justify-center ${isGrowing ? 'animate-jump-joy' : ''}`}>
            {/* Generated Image or Loader */}
            <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center relative">
                {imageLoading && !generatedImageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {generatedImageUrl ? (
                    <img 
                        src={generatedImageUrl} 
                        alt={currentStageDef.title}
                        className="w-full h-full object-contain animate-pop-in drop-shadow-2xl"
                    />
                ) : (
                    <div className={`text-9xl transition-opacity duration-500 ${imageLoading ? 'opacity-50' : 'opacity-100'}`}>
                        {currentStageDef.emoji}
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* Game Area */}
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur rounded-3xl shadow-xl p-6 md:p-8 min-h-[250px] flex flex-col justify-center border-4 border-indigo-100">
        {loading ? (
          <div className="flex flex-col items-center text-indigo-400">
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium">Listening to your friend...</p>
          </div>
        ) : currentQuestion ? (
          <div className="animate-pop-in">
            <h3 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-6 text-center leading-relaxed">
              {currentQuestion.questionText}
            </h3>
            
            <div className="grid gap-4">
              {currentQuestion.options.map((opt, idx) => {
                let btnClass = "bg-indigo-50 text-indigo-900 border-2 border-indigo-200";
                
                // Visual feedback states
                if (selectedOption !== null) {
                   if (idx === currentQuestion.correctAnswerIndex) btnClass = "bg-green-500 text-white border-green-600 shadow-lg transform scale-105";
                   else if (idx === selectedOption) btnClass = "bg-red-500 text-white border-red-600";
                   else btnClass = "bg-slate-100 text-slate-400 border-slate-200";
                } else if (!isAudioPlaying) {
                   // Hover state only when active
                   btnClass += " hover:bg-indigo-100 cursor-pointer";
                } else {
                   // Disabled state while audio playing
                   btnClass += " opacity-60 cursor-not-allowed";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedOption !== null || isAudioPlaying}
                    className={`
                      w-full p-4 rounded-2xl text-xl font-bold text-left transition-all duration-200
                      ${btnClass}
                    `}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback Overlay/Section */}
            {showFeedback && (
              <div className="mt-6 text-center animate-pop-in">
                <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {isCorrect ? "Correct! 🎉" : "Oops! Try again."}
                </p>
                {isCorrect ? (
                    <button 
                        onClick={handleNext}
                        disabled={isAudioPlaying}
                        className={`
                          bg-green-500 text-white px-10 py-4 rounded-full text-2xl font-bold shadow-xl transition-all
                          ${isAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600 hover:scale-105'}
                        `}
                    >
                        {isAudioPlaying ? "Wait..." : (stage + 1 === TOTAL_STAGES ? "Finish!" : "Grow Up! ⬆️")}
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            if (!isAudioPlaying) {
                                setSelectedOption(null);
                                setShowFeedback(false);
                            }
                        }}
                        disabled={isAudioPlaying}
                        className={`
                           bg-orange-400 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg
                           ${isAudioPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'}
                        `}
                    >
                        {isAudioPlaying ? "..." : "Try Again ↺"}
                    </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-indigo-400">Something went wrong.</div>
        )}
      </div>
    </div>
  );
};