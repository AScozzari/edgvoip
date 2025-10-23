import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutProps {
  expiresAt: number;
  onLogout: () => void;
}

export default function SessionTimeout({ expiresAt, onLogout }: SessionTimeoutProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);

      // Show warning when 2 minutes left
      if (remaining <= 2 * 60 * 1000 && remaining > 0) {
        setShowWarning(true);
      } else if (remaining === 0) {
        onLogout();
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning || timeLeft === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Sessione in scadenza
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            La tua sessione scadrà tra{' '}
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-600">
              Fai login per continuare
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
        >
          Esci
        </button>
      </div>
    </div>
  );
}
