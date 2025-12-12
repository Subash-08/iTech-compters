// src/components/showcase/CountdownTimer.tsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  timerText?: string;
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  timerText = 'Ends in',
  onExpire,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="font-medium text-black text-sm">Offer Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex text-black border items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{timerText}</span>
      </div>
      
      <div className="flex text-black items-center gap-2">
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="days" />
        )}
        <TimeUnit value={timeLeft.hours} label="hrs" />
        <TimeUnit value={timeLeft.minutes} label="min" />
        <TimeUnit value={timeLeft.seconds} label="sec" />
      </div>
    </div>
  );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex text-black flex-col items-center">
    <div className="rounded-lg px-2 py-1 min-w-8 text-center">
      <span className="text-sm font-bold">{value.toString().padStart(2, '0')}</span>
    </div>
    <span className="text-xs text-gray-500 mt-1">{label}</span>
  </div>
);

export default CountdownTimer;