import { useState, useEffect } from 'react';

export const useTimer = (initialSeconds: number = 0, isRunning: boolean = true) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const resetTimer = () => setSeconds(0);

  const formattedTime = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return { seconds, formattedTime, resetTimer, setSeconds };
};
