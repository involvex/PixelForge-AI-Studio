import type React from "react";
import { useEffect, useState } from "react";

interface AppWindow extends Window {
  ReactAppLoaded?: boolean;
}

const LoadingFallback: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    // Check if main app has loaded
    const checkAppLoaded = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        (window as AppWindow).ReactAppLoaded
      ) {
        clearInterval(progressInterval);
        clearInterval(checkAppLoaded);
        setLoadingProgress(100);
      }
    }, 100);

    // Timeout for error handling
    const timeout = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(checkAppLoaded);
      setErrorMessage(
        "Application failed to load. Please check your connection and refresh.",
      );
    }, 15000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(checkAppLoaded);
      clearTimeout(timeout);
    };
  }, []);

  const handleRetry = () => {
    setErrorMessage(null);
    setLoadingProgress(0);
    window.location.reload();
  };

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-4">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">
            Loading Failed
          </h2>
          <p className="text-gray-300 mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            aria-label="Loading progress indicator"
          >
            <title>Loading Progress</title>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * loadingProgress) / 100}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="14"
              fontWeight="bold"
            >
              {Math.round(loadingProgress)}%
            </text>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">PixelForge AI Studio</h1>
        <p className="text-gray-400 mb-6">Loading application...</p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Initializing pixel engine</p>
          <p>Loading AI modules</p>
          <p>Preparing canvas tools</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
