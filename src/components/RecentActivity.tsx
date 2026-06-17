import React, { useState, useEffect } from 'react';

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState([
    { number: '0767****56', amount: 5000, time: '12 mins ago' },
    { number: '0712****34', amount: 10000, time: '25 mins ago' },
    { number: '0733****89', amount: 3000, time: '1 hour ago' },
  ]);

  const generateRandomActivity = () => {
    const prefixes = ['0712', '0722', '0733', '0744', '0755', '0767', '0777', '0788', '0799'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumbers = Math.floor(Math.random() * 900 + 100);
    const amount = [3000, 5000, 10000, 12500, 16000, 21000, 25500, 30000, 35000, 40000, 45000, 50000][Math.floor(Math.random() * 12)];
    const times = ['just now', '2 mins ago', '5 mins ago', '8 mins ago', '12 mins ago', '15 mins ago', '20 mins ago', '30 mins ago'];
    
    return {
      number: `${prefix}****${randomNumbers}`,
      amount: amount,
      time: times[Math.floor(Math.random() * times.length)]
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivities = [generateRandomActivity(), ...prev.slice(0, 2)];
        return newActivities;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-fuliza-dark/5 to-fuliza-green/5 rounded-xl p-4 border-2 border-fuliza-green/20">
      <div className="flex items-center gap-3 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuliza-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-fuliza-green"></span>
        </span>
        <span className="font-semibold text-fuliza-dark">Live Activity</span>
      </div>
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between text-sm bg-white/50 p-2 rounded-lg transition-all duration-300 hover:bg-white"
          >
            <span className="font-medium text-fuliza-dark">{activity.number}</span>
            <span className="text-fuliza-green font-bold">+ Ksh {activity.amount.toLocaleString()}</span>
            <span className="text-gray-500 text-xs">{activity.time}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        Activity is anonymized to protect customer privacy.
      </div>
    </div>
  );
};

export default RecentActivity;