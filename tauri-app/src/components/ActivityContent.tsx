import React from 'react';
import ActivityItem from './ActivityItem';
import { ACTIVITIES_DATA } from '../App';

const ActivityContent: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Current meeting prompt
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No active meeting detected. Start a meeting to see real-time prompts and insights.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activities
        </h3>
        <div className="space-y-2">
          {ACTIVITIES_DATA.map((activity, index) => (
            <ActivityItem
              key={index}
              title={activity.title}
              duration={activity.duration}
              greenCount={activity.greenCount}
              redCount={activity.redCount}
              description={activity.description}
              time={activity.time}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityContent; 