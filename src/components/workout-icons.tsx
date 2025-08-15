// SVG Icons for workout activities extracted from dashboard

import React from 'react';

export function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}

export function RunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="17" cy="5" r="3"></circle>
      <path d="M10 17l2-4 4-1 3 3-4 4"></path>
      <path d="M7 20l.9-2.8c.3-.8.8-1.5 1.5-1.9l2.6-1.3"></path>
      <path d="M13 9l-1.8-1.8c-.6-.6-1.5-1-2.4-.8L5 7"></path>
    </svg>
  );
}

export function WalkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="13" cy="4" r="2"></circle>
      <path d="M15 7v11"></path>
      <path d="M9 7v11"></path>
      <path d="M9 11h6"></path>
      <path d="M9 18h6"></path>
    </svg>
  );
}

export function BicycleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="5.5" cy="17.5" r="3.5"></circle>
      <circle cx="18.5" cy="17.5" r="3.5"></circle>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
      <path d="M8 21l-2-4 1.5-7.5L6 8.5l-2 2 3.5 3.5"></path>
      <path d="M19 15l-3.5-5.5L13 11"></path>
    </svg>
  );
}

export function DumbbellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M14.4 14.4 9.6 9.6"></path>
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"></path>
      <path d="m21.5 21.5-1.4-1.4"></path>
      <path d="M3.9 3.9 2.5 2.5"></path>
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"></path>
    </svg>
  );
}

export function SwimIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2c1.3 0 1.9-.5 2.5-1"></path>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2c1.3 0 1.9-.5 2.5-1"></path>
      <path d="M18 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
      <path d="M14 22V8l-2 2-1.5-1.5L16 3l5.5 5.5L20 10l-2-2v14h-4z"></path>
    </svg>
  );
}

// Activity icon mapping
export const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  'running': <RunIcon className="h-5 w-5 text-green-500" />,
  'walking': <WalkIcon className="h-5 w-5 text-green-500" />,
  'cycling': <BicycleIcon className="h-5 w-5 text-green-500" />,
  'strength_training': <DumbbellIcon className="h-5 w-5 text-green-500" />,
  'swimming': <SwimIcon className="h-5 w-5 text-green-500" />,
  'hiit': <ActivityIcon className="h-5 w-5 text-green-500" />,
  'default': <ActivityIcon className="h-5 w-5 text-green-500" />
};
