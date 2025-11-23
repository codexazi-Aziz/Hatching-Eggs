import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Singleton Audio Context & Source Tracking
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// In-Memory Cache for Images to speed up transitions
const imageCache = new Map<string, string>();

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

// Helper to decode base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM data from Gemini TTS
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // PCM 16-bit signed integer to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateQuestion = async (animal: string, age: number, stageLevel: number): Promise<Question> => {
  try {
    let difficulty = 'medium';
    let topic = 'general fun';

    // Difficulty scaling for 8 stages (0 to 7)
    if (stageLevel <= 1) {
      difficulty = 'very easy';
      topic = 'colors, sounds, or identifying simple objects';
    } else if (stageLevel <= 3) {
      difficulty = 'easy';
      topic = 'simple counting, shapes, or basic animal actions';
    } else if (stageLevel <= 5) {
      difficulty = 'medium';
      topic = 'simple logic, comparisons (bigger/smaller), or nature facts';
    } else if (stageLevel <= 6) {
      difficulty = 'harder';
      topic = 'cause and effect, habitats, or helping friends';
    } else {
      difficulty = 'challenging';
      topic = 'fun science facts, space, or puzzles suitable for kids';
    }
    
    const prompt = `Generate a multiple-choice question for a ${age}-year-old child playing a game with a ${animal}. 
    Difficulty: ${difficulty}. 
    Topic: ${topic}.
    The question text should be slightly longer (15-25 words), descriptive, and create a small playful scenario or story context before asking the question.
    Provide 3 options.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionText: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING, description: "A short, encouraging sentence explaining the answer or cheering them on." }
          },
          required: ["questionText", "options", "correctAnswerIndex", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text) as Question;

  } catch (error) {
    console.error("Error generating question:", error);
    return {
      questionText: `The ${animal} is looking very hungry today and wants a snack! What sound does a ${animal} make when it is happy?`,
      options: ["Moo", "Roar/Cluck", "Meow"],
      correctAnswerIndex: 1,
      explanation: "That's right! Good job!"
    };
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Puck'): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const ctx = getAudioContext();
    
    const audioBuffer = await decodeAudioData(
        decode(base64Audio), 
        ctx, 
        24000, 
        1
    );
    
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const generateAnimalImage = async (animal: string, stageTitle: string): Promise<string | null> => {
  // Check Cache First
  const cacheKey = `${animal}-${stageTitle}`;
  if (imageCache.has(cacheKey)) {
    console.log("Serving image from cache for:", cacheKey);
    return imageCache.get(cacheKey) || null;
  }

  try {
    let prompt = "";
    if (stageTitle.includes("Real Realistic") || stageTitle.includes("Nature")) {
         prompt = `A hyper-realistic, award-winning National Geographic style photograph of a real ${animal} in its natural beautiful habitat. High detail, cinematic lighting, 4k resolution.`;
    } else {
        prompt = `A cute, adorable, high quality 3D render of a ${stageTitle} ${animal} looking at the camera, bright vivid colors, friendly face, pixar style, simple white or soft pastel background, full body shot, centered.`;
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        const finalUrl = `data:image/png;base64,${base64EncodeString}`;
        
        // Save to cache
        imageCache.set(cacheKey, finalUrl);
        
        return finalUrl;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.onended = null; // Remove listener to prevent firing events
    } catch (e) {
      // Ignore error if already stopped
    }
    currentSource = null;
  }
};

// Returns a promise that resolves when audio finishes playing
export const playAudioBuffer = async (buffer: AudioBuffer): Promise<void> => {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  stopAudio();

  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (currentSource === source) {
        currentSource = null;
      }
      resolve();
    };

    source.start(0);
    currentSource = source;
  });
};