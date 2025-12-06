import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-eva-surface border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-800"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SkeletonWorkCard: React.FC = () => {
  return (
    <div className="bg-eva-surface border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-800"></div>
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-700 rounded w-20"></div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonCharacterCard: React.FC = () => {
  return (
    <div className="bg-eva-surface border border-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-800"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="flex gap-1">
          <div className="h-5 w-12 bg-gray-700 rounded"></div>
          <div className="h-5 w-12 bg-gray-700 rounded"></div>
        </div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SkeletonDetail: React.FC = () => {
  return (
    <div className="bg-eva-surface border border-white/10 rounded-xl p-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 h-80 bg-gray-800 rounded-lg"></div>
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-black/20 rounded-lg p-4 text-center animate-pulse">
          <div className="h-10 bg-gray-700 rounded w-16 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-24 mx-auto"></div>
        </div>
      ))}
    </div>
  );
};

