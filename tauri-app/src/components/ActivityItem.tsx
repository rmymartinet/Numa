import React from 'react';

interface ActivityItemProps {
  title: string;
  duration: string;
  greenCount: number;
  redCount: number;
  description: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  duration,
  greenCount,
  redCount,
  description,
  time,
}) => {
  return (
    <div className='flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer '>
      {/* Purple headphone icon */}
      <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0'>
        <span className='text-white text-sm'>🎧</span>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between mb-1'>
          <h3 className='text-sm font-medium text-gray-900 truncate'>
            {title}
          </h3>
          <div className='flex items-center space-x-2 text-xs text-gray-500'>
            <span>{duration}</span>
            <div className='flex items-center space-x-1'>
              <span className='text-green-500'>{greenCount}</span>
              <span className='text-red-500'>{redCount}</span>
            </div>
          </div>
        </div>
        <p className='text-xs text-gray-600 mb-1 truncate'>{description}</p>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-500'>{time}</span>
          <button className='text-gray-400 hover:text-gray-600'>
            <span className='text-lg'>⋯</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
