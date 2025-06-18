'use client';

import React from 'react';

interface DropboxAuthProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  onConnectClick: () => void;
  highlight?: boolean;
}

const DropboxAuth: React.FC<DropboxAuthProps> = ({ isAuthenticated, isLoading, onConnectClick, highlight }) => {

  // if (isLoading) {
  //   return <div className="text-center p-4">Checking authentication status...</div>;
  // }

  if (isAuthenticated) {
  } else {
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isAuthenticated ? (
        <div
          className={`glass-pane text-glass w-full h-full flex items-center justify-center rounded-lg font-black text-xl md:text-2xl min-h-[64px] md:h-24 text-center select-none !bg-green-500/60 backdrop-blur-md border border-white/30 shadow-lg`}
        >
          CONNECTED
        </div>
      ) : (
        <button
          onClick={onConnectClick}
          className={`glass-pane text-glass w-full h-full flex items-center justify-center rounded-lg font-black text-xl md:text-2xl min-h-[64px] md:h-24 text-center transition-all focus:outline-none
            ${highlight ? 'animate-pulse !bg-blue-500/60 backdrop-blur-md border border-white/30 shadow-lg' : 'bg-white bg-opacity-80 hover:bg-opacity-100 active:opacity-100'}`}
          style={{ pointerEvents: 'auto' }}
        >
          CONNECT
        </button>
      )}
    </div>
  );
};

export default DropboxAuth;