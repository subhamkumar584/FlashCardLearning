"use client";

import React from "react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export const SkeletonGrid: React.FC = () => {
  const items = Array.from({ length: 6 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 p-4 animate-pulse"
        >
          <div className="h-4 w-1/2 bg-white/20 rounded mb-3" />
          <div className="h-3 w-full bg-white/10 rounded mb-2" />
          <div className="h-3 w-5/6 bg-white/10 rounded mb-2" />
          <div className="h-3 w-2/3 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
};
