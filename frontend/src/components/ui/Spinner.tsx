interface SpinnerProps {
  className?: string;
  size?: number;
}

export default function Spinner({ className = '', size = 28 }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-label="Loading">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C6A15E"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="animate-spin"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  );
}
