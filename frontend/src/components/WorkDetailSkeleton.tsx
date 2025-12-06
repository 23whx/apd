import React from 'react';

export const WorkDetailSkeleton: React.FC = () => {
  return (
    <>
      {/* Back Button Skeleton */}
      <div className="h-6 w-32 bg-gray-700 rounded mb-6 animate-pulse"></div>
      
      {/* Work Detail Skeleton */}
      <div className="bg-eva-surface border border-white/10 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster Skeleton */}
          <div className="w-full md:w-64 h-80 bg-gray-800 rounded-lg animate-pulse flex-shrink-0"></div>
          
          {/* Content Skeleton */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <div className="h-10 w-3/4 bg-gray-700 rounded animate-pulse"></div>
            
            {/* Names */}
            <div className="space-y-2">
              <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Summary */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Links */}
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Characters Section Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-eva-surface border border-white/5 rounded-xl overflow-hidden">
              <div className="aspect-square bg-gray-800 animate-pulse"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-2/3 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

