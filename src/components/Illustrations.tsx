import type * as React from "react";
interface P { size?: number; className?: string }

export const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="19" fill="#2E1065" />
    <path d="M32 11c8.5 10.5 15 17.5 15 26a15 15 0 0 1-30 0c0-8.5 6.5-15.5 15-26z" fill="#F5F3FF" />
    <path d="M17 38c5.5-3.5 10 3.5 15 0s9.5 3.5 15 0v.5a15 15 0 0 1-30 0z" fill="#7C3AED" />
    <circle cx="46" cy="15" r="3.5" fill="#F9A8D4" />
  </svg>
);

export const MilkCan: React.FC<P> = ({ size = 48, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
    <rect x="20" y="8" width="24" height="8" rx="4" fill="#C4B5FD" />
    <path d="M18 18h28l4 8v26a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V26z" fill="#DDD6FE" />
    <path d="M14 26h36" stroke="#C4B5FD" strokeWidth="3" />
    <rect x="22" y="32" width="20" height="14" rx="4" fill="#7C3AED" />
    <path d="M26 39h12M26 43h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Tanker: React.FC<P> = ({ size = 64, className }) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 120 66" className={className} aria-hidden>
    <rect x="4" y="12" width="74" height="34" rx="17" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="2" />
    <path d="M12 32c8-5 14 5 22 0s14 5 22 0 12 4 18 0" stroke="#7C3AED" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M80 22h20l10 14v14H80z" fill="#2E1065" />
    <path d="M86 27h12l6 9H86z" fill="#E9D5FF" />
    <rect x="4" y="46" width="108" height="6" rx="3" fill="#7C6FB0" />
    {[26, 60, 98].map((x) => (
      <g key={x}><circle cx={x} cy="54" r="8" fill="#2E1065" /><circle cx={x} cy="54" r="3" fill="#DDD6FE" /></g>
    ))}
  </svg>
);
