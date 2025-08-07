import React from 'react';

interface PromptCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({
  title,
  description,
  icon,
  isSelected
}) => {
  return (
    <div className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSelected ? 'bg-blue-500' : 'bg-gray-100'
        }`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <h3 className={`text-sm font-medium ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          <p className={`text-xs ${
            isSelected ? 'text-blue-700' : 'text-gray-600'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptCard; 