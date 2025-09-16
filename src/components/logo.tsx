
'use client';

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("h-full w-full", className)}
      aria-label="AIP Logo"
    >
      <g fill="currentColor">
        {/* Central "eye" or core */}
        <circle cx="128" cy="128" r="32" opacity="1" />
        
        {/* Orbiting elements / robotic arms */}
        <path 
            d="M128,56a72,72,0,1,0,72,72,72,72,0,0,0-72-72Zm0,128a56,56,0,1,1,56-56,56,56,0,0,1-56,56Z"
            opacity="0.2"
        />
        <path 
            d="M197.8,49.2a112,112,0,1,0-139.6,0"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.5"
        />

        {/* Small circuit nodes */}
        <circle cx="56" cy="72" r="8" opacity="0.8" />
        <circle cx="200" cy="72" r="8" opacity="0.8" />
        <circle cx="192" cy="184" r="8" opacity="0.8" />
      </g>
    </svg>
  );
}
