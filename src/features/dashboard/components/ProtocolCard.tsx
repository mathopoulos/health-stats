import React from 'react';

interface ProtocolCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ProtocolCard({ title, children, className = "" }: ProtocolCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm min-h-[200px] flex flex-col ${className}`}>
      <div className="flex flex-col h-full">
        <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {children}
      </div>
    </div>
  );
}
