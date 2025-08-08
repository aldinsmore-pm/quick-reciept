export default function ProcessingAnimation() {
  // Simple, fun lawn-themed loader: a looping leaf swirl
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-emerald-700">
      <svg
        width="88"
        height="88"
        viewBox="0 0 88 88"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Processing animation"
      >
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>
        <g transform="translate(44,44)">
          <g>
            <path
              d="M0 -30 C 10 -28, 18 -20, 20 -10 C 12 -12, 6 -8, 0 0 C -6 -8, -12 -12, -20 -10 C -18 -20, -10 -28, 0 -30 Z"
              fill="url(#lg)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          <circle r="2" fill="#064e3b">
            <animate
              attributeName="r"
              values="2;4;2"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
      <p className="text-sm text-emerald-800">Processing receipt…</p>
    </div>
  );
}


