import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimalDef, UserData, Question } from '../types';
import { generateQuestion, generateSpeech, playAudioBuffer, generateAnimalImage, stopAudio } from '../services/geminiService';
import { TOTAL_STAGES } from '../constants';

interface Props {
  animal: AnimalDef;
  user: UserData;
  onWin: () => void;
}

export const GameScreen: React.FC<Props> = ({ animal, user, onWin }) => {
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  
  // Track if the user is currently viewing the question (to prevent stale audio overlap)
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

  // Play audio helper
  const speak = useCallback(async (text: string, overrideVoice?: string) => {
    const voice = overrideVoice || currentStageDef.voice;
    const buffer = await generateSpeech(text, voice);
    if (buffer) playAudioBuffer(buffer);
  }, [currentStageDef.voice]);

  // Load Image for Stage
  useEffect(() => {
    let mounted = true;
    const fetchImage = async () => {
        setImageLoading(true);
        setGeneratedImageUrl(null);
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
    if (!introPlayed) {
      setIntroPlayed(true);
      const greeting = `Hello ${user.name}. I am your new friend! Can you help me grow?`;
      speak(greeting, 'Puck'); 
      loadQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestion = async () => {
    setLoading(true);
    isQuestionActiveRef.current = true; // Mark question as active
    
    // Clear previous pre-fetched audio
    setSuccessAudio(null);
    setFailureAudio(null);

    // 1. Generate Question Text
    const q = await generateQuestion(animal.name, user.age, stage);
    
    // 2. SHOW UI IMMEDIATELY (Don't wait for audio)
    setCurrentQuestion(q);
    setLoading(false);
    
    // 3. Load Audio in Background
    if (q) {
       const voice = currentStageDef.voice;
       
       // A. Fetch Question Audio (Background)
       generateSpeech(q.questionText, voice).then((audioBuffer) => {
         // Only play if the user hasn't answered yet and component is still mounted
         if (audioBuffer && isQuestionActiveRef.current && !selectedOption) {
            playAudioBuffer(audioBuffer);
         }
       });
       
       // B. Fetch Success Audio (Background)
       const correctOptionText = q.options[q.correctAnswerIndex];
       const successText = `Correct! ${correctOptionText}. ${q.explanation}`;
       generateSpeech(successText, voice).then(buff => setSuccessAudio(buff));

       // C. Fetch Failure Audio (Background)
       const failureText = "Oh no, that is not right. Try again!";
       generateSpeech(failureText, voice).then(buff => setFailureAudio(buff));
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return; // Prevent double click
    
    // Stop the question audio from playing if it arrives late
    isQuestionActiveRef.current = false;
    stopAudio(); // Stop current reading

    setSelectedOption(index);
    
    const correct = index === currentQuestion?.correctAnswerIndex;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      // Use pre-fetched audio if available, otherwise generate it (fallback)
      if (successAudio) {
        playAudioBuffer(successAudio);
      } else {
         const answerName = currentQuestion?.options[index] || "";
         speak(`Correct! ${answerName}. ${currentQuestion?.explanation || "Good job!"}`);
      }
    } else {
      if (failureAudio) {
        playAudioBuffer(failureAudio);
      } else {
        speak("Oh no, that is not right. Try again!");
      }
    }
  };

  const handleNext = () => {
    if (isCorrect) {
      if (stage + 1 >= TOTAL_STAGES) {
        onWin();
      } else {
        // Trigger celebration animation
        setIsGrowing(true);
        setShowFeedback(false);
        setSelectedOption(null);
        setIsCorrect(null);
        stopAudio();
        
        // Wait for animation to finish before changing stage
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
        const growTexts = [
            "Yay! I am bigger!", 
            "Wow, look at me grow!", 
            "I am getting taller!",
            "I am stronger now!",
            "Getting bigger every day!",
            "Almost grown up!",
            "I feel so powerful!"
        ];
        // We speak first, then load question after a delay to let the speech finish
        const textToSpeak = growTexts[Math.min(stage - 1, growTexts.length - 1)];
        speak(textToSpeak);
        setTimeout(() => loadQuestion(), 4000);
    } else if (introPlayed && stage === 0) {
        // Already handled by init effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);


  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl bg-white/50 rounded-full h-4 mb-4 mt-2">
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
            <p className="text-lg font-medium">Thinking of a fun question...</p>
          </div>
        ) : currentQuestion ? (
          <div className="animate-pop-in">
            <h3 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-6 text-center leading-relaxed">
              {currentQuestion.questionText}
            </h3>
            
            <div className="grid gap-4">
              {currentQuestion.options.map((opt, idx) => {
                let btnClass = "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-indigo-200";
                if (selectedOption !== null) {
                   if (idx === currentQuestion.correctAnswerIndex) btnClass = "bg-green-500 text-white border-green-600 shadow-lg transform scale-105";
                   else if (idx === selectedOption) btnClass = "bg-red-500 text-white border-red-600";
                   else btnClass = "bg-slate-100 text-slate-400 border-slate-200";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedOption !== null}
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
                        className="bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-full text-2xl font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                        {stage + 1 === TOTAL_STAGES ? "Finish!" : "Grow Up! ⬆️"}
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setSelectedOption(null);
                            setShowFeedback(false);
                        }}
                        className="bg-orange-400 hover:bg-orange-500 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg"
                    >
                        Try Again ↺
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