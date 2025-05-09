import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Mail, MessageSquare } from 'lucide-react';

interface ToneSelectorProps {
  selectedTone: string;
  onToneSelect: (tone: string) => void;
  selectedLength: string;
  onLengthSelect: (length: string) => void;
  selectedInputType: string;
  onInputTypeSelect: (type: string) => void;
}

const tones = [
  { id: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { id: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
  { id: 'confident', label: 'Confident', description: 'Strong and assertive' },
  { id: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive' },
  { id: 'neutral', label: 'Neutral', description: 'Balanced and objective' },
  { id: 'persuasive', label: 'Persuasive', description: 'Convincing and influential' },
];

const lengths = [
  { id: 'concise', label: 'Shorter', description: '75% of original length' },
  { id: 'balanced', label: 'Same Length', description: '100% of original length' },
  { id: 'detailed', label: 'Longer', description: '150% of original length' },
];

const inputTypes = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'message', label: 'Message', icon: MessageSquare },
];

export default function ToneSelector({ 
  selectedTone, 
  onToneSelect, 
  selectedLength, 
  onLengthSelect,
  selectedInputType,
  onInputTypeSelect
}: ToneSelectorProps) {
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Content Type
          </label>
          <div className="flex gap-1 md:gap-2">
            {inputTypes.map((type) => {
              const Icon = type.icon;
              return (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onInputTypeSelect(type.id)}
                  className={`p-1.5 md:p-2 rounded-lg transition-all flex items-center gap-1 md:gap-1.5 ${
                    selectedInputType === type.id
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{type.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
          Tone
        </label>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {tones.map((tone) => (
            <motion.button
              key={tone.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToneSelect(tone.id)}
              className={`tag-button text-xs md:text-sm ${
                selectedTone === tone.id
                  ? 'tag-button-selected'
                  : 'tag-button-unselected'
              }`}
              title={tone.description}
            >
              {tone.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 md:gap-2">
          <ScanLine className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Target Length
        </label>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {lengths.map((length) => (
            <motion.button
              key={length.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLengthSelect(length.id)}
              className={`tag-button text-xs md:text-sm ${
                selectedLength === length.id
                  ? 'tag-button-selected'
                  : 'tag-button-unselected'
              }`}
              title={length.description}
            >
              {length.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}