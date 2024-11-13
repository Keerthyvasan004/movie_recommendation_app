// MoodSelector.tsx
import React from 'react';

interface MoodSelectorProps {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodChange }) => {
  const moods = ['Happy', 'Sad', 'Excited', 'Romantic', 'Scared'];

  return (
    <div className="mood-selector">
      <label className="text-lg font-semibold">Select Your Mood:</label>
      <div className="flex gap-2 mt-2">
        {moods.map((mood) => (
          <button
            key={mood}
            className={`py-2 px-4 rounded ${selectedMood === mood ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => onMoodChange(mood)}
          >
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
