import React from 'react';

const LoadingSpinner = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      <span className="ml-2">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
