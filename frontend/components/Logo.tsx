type LogoProps = { className?: string };

export default function Logo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="divr-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B7F34A" />
            <stop offset="100%" stopColor="#7ED321" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="#0B1C2D" stroke="url(#divr-mark)" strokeWidth="2" />
        <path
          d="M9 11.5c2.4 0 3.6 1.7 6 1.7s3.6-1.7 6-1.7M7.5 16c2.4 0 4.1 1.7 6.5 1.7s4.1-1.7 6.5-1.7M9 20.5c2.4 0 3.6 1.7 6 1.7s3.6-1.7 6-1.7"
          stroke="url(#divr-mark)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-cream sm:text-2xl">
        divr
      </span>
    </span>
  );
}
