export default function Hills() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 select-none" aria-hidden>
      <svg viewBox="0 0 1440 200" width="100%" height="200" preserveAspectRatio="none">
        <path
          className="hill-slow"
          d="M0,120 C200,80 300,160 480,140 C660,120 780,80 960,120 C1140,160 1260,120 1440,140 L1440,200 L0,200 Z"
          fill="#d1fae5"
        />
        <path
          className="hill-mid"
          d="M0,140 C180,110 320,170 520,150 C700,130 860,100 1040,130 C1200,160 1320,140 1440,150 L1440,200 L0,200 Z"
          fill="#a7f3d0"
          opacity="0.9"
        />
        <path
          className="hill-fast"
          d="M0,160 C160,140 360,180 560,170 C760,160 900,140 1080,160 C1240,180 1340,160 1440,165 L1440,200 L0,200 Z"
          fill="#6ee7b7"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}


