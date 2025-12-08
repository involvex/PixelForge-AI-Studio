import type React from "react";
import { useEffect, useState } from "react";
import ErrorBoundary from "./ErrorBoundary";
import LoadingFallback from "./LoadingFallback";

interface AppWindow extends Window {
  ReactAppLoaded?: boolean;
}

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Mark that the app is loading
    if (typeof window !== "undefined") {
      (window as AppWindow).ReactAppLoaded = false;
    }

    // Simulate loading and check for successful mount
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        (window as AppWindow).ReactAppLoaded = true;
      }
    }, 1000);

    // Error detection
    const errorTimer = setTimeout(() => {
      if (isLoading) {
        setLoadError(
          "Application took too long to load. Please check your connection.",
        );
      }
    }, 10000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(errorTimer);
    };
  }, [isLoading]);

  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    window.location.reload();
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-4">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-3">
            Loading Failed
          </h2>
          <p className="text-gray-300 mb-4">{loadError}</p>
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

  if (isLoading) {
    return <LoadingFallback />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default AppLoader;
