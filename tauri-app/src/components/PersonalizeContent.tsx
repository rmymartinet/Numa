import React from 'react';
import PromptCard from './PromptCard';

const PersonalizeContent: React.FC = () => {
  const [selectedStyle] = React.useState<
    'school' | 'meetings' | 'sales' | 'recruiting' | 'custom'
  >('meetings');

  const promptStyles = [
    {
      id: 'school' as const,
      title: 'School',
      description: 'Academic and educational communication style',
      icon: '🎓',
    },
    {
      id: 'meetings' as const,
      title: 'Meetings',
      description: 'Professional meeting and presentation style',
      icon: '🤝',
    },
    {
      id: 'sales' as const,
      title: 'Sales',
      description: 'Persuasive and engaging sales communication',
      icon: '💼',
    },
    {
      id: 'recruiting' as const,
      title: 'Recruiting',
      description: 'HR and recruitment communication style',
      icon: '👥',
    },
    {
      id: 'custom' as const,
      title: 'Custom',
      description: 'Train AI on your personal communication style',
      icon: '🎯',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Choose your prompt style */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Choose your prompt style
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {promptStyles.map(style => (
            <PromptCard
              key={style.id}
              title={style.title}
              description={style.description}
              icon={style.icon}
              isSelected={selectedStyle === style.id}
            />
          ))}
        </div>
      </div>

      {/* Custom Voice Training */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Custom Voice Training
        </h3>
        <div className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <button className='bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200'>
              🎤 Start Recording
            </button>
            <span className='text-sm text-gray-600 dark:text-gray-300'>
              Record your voice to train the AI on your communication style
            </span>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Text Sample
            </label>
            <textarea
              className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              rows={4}
              placeholder='Enter a sample of your writing style...'
            />
          </div>
        </div>
      </div>

      {/* Default Model */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Default Model
        </h3>
        <select className='w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'>
          <option value='gpt-4o'>GPT-4o (Recommended)</option>
          <option value='gpt-4'>GPT-4</option>
          <option value='gpt-3.5-turbo'>GPT-3.5 Turbo</option>
        </select>
      </div>
    </div>
  );
};

export default PersonalizeContent;
