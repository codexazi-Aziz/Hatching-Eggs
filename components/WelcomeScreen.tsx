import React, { useState } from 'react';
import { UserData } from '../types';

interface Props {
  onStart: (data: UserData) => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart({ name, age: parseInt(age) });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
      <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-md w-full border-8 border-white/30 animate-pop-in">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 mb-4 drop-shadow-sm leading-tight">
          Egg Hatch Friends
        </h1>
        <p className="text-indigo-500 mb-10 text-xl font-medium">Grow your own AI animal friend!</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="text-left">
            <label className="block text-purple-600 font-extrabold mb-3 text-xl ml-2">What is your name?</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-5 border-4 border-indigo-100 rounded-3xl text-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder-indigo-200 text-indigo-600 font-bold"
              placeholder="Enter name..."
            />
          </div>

          <div className="text-left">
            <label className="block text-purple-600 font-extrabold mb-3 text-xl ml-2">How old are you?</label>
            <input
              type="number"
              required
              min="3"
              max="12"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-5 border-4 border-indigo-100 rounded-3xl text-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all text-indigo-600 font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold py-5 rounded-3xl text-2xl shadow-xl shadow-indigo-200 transform transition hover:scale-105 active:scale-95 mt-4"
          >
            Let's Play! 🚀
          </button>
        </form>
      </div>
    </div>
  );
};