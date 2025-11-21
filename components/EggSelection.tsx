import React from 'react';
import { ANIMALS } from '../constants';
import { AnimalType } from '../types';

interface Props {
  onSelect: (animal: AnimalType) => void;
}

export const EggSelection: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl md:text-5xl font-bold text-blue-600 mb-8 text-center drop-shadow-sm">
        Pick an Egg to Hatch!
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
        {Object.values(ANIMALS).map((animal) => (
          <button
            key={animal.id}
            onClick={() => onSelect(animal.id)}
            className={`
              ${animal.eggColor} 
              relative group h-80 rounded-3xl border-b-8 
              flex flex-col items-center justify-between
              transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-lg
              pt-8 pb-6 px-2
            `}
          >
            <span className="text-8xl filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">
              {animal.eggEmoji}
            </span>
            
            <div className="w-full flex justify-center">
                <div className="bg-white/90 px-6 py-2 rounded-xl text-gray-800 font-extrabold text-xl shadow-sm border-2 border-blue-100 w-full max-w-[90%] break-words">
                {animal.name}
                </div>
            </div>

            <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
};