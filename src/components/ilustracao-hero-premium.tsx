import React from 'react';

export const IlustracaoHeroPremium = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <svg
        viewBox="0 0 1000 650"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_48px_80px_rgba(20,33,61,0.06)]"
      >
        <defs>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="25" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="strongShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.15" />
          </filter>
          
          <linearGradient id="skinGrad" x1="400" y1="180" x2="400" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE0BD" />
            <stop offset="1" stopColor="#FFCD94" />
          </linearGradient>

          <linearGradient id="blobGrad" x1="400" y1="50" x2="400" y2="600" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--color-primary)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* The Large Soft Background Shape */}
        <path
          d="M750 325C750 500 600 620 400 620C200 620 50 500 50 325C50 150 200 30C400 30C600 30 750 150 750 325Z"
          fill="url(#blobGrad)"
        />

        {/* Character - Sitting in a large beanbag/chair */}
        <g className="">
          {/* Large Orange Beanbag (Refined shape) */}
          <path
            d="M200 520C200 420 280 340 400 340C520 340 680 420 680 520C680 620 550 670 400 670C250 670 200 620 200 520Z"
            fill="#F37552"
          />
          {/* Internal shading for beanbag depth */}
          <path
            d="M300 480C350 440 450 440 580 480"
            stroke="black"
            strokeOpacity="0.08"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Legs */}
          <path
            d="M360 490C310 520 270 560 290 580C310 600 360 550 410 510"
            fill="#3B82F6"
          />
          <path
            d="M440 490C490 520 530 560 510 580C490 600 440 550 390 510"
            fill="#2563EB"
          />
          {/* Feet */}
          <path d="M275 575C265 585 280 595 295 585" fill="#FFE0BD" />
          <path d="M525 575C535 585 520 595 505 585" fill="#FFE0BD" />

          {/* Torso */}
          <path
            d="M350 460C350 460 330 360 340 310C350 260 380 240 410 240C440 240 470 260 480 310C490 360 470 460 470 460H350Z"
            fill="#3B82F6"
          />

          {/* Arms */}
          <path
            d="M350 340L310 420L360 450"
            stroke="#FFE0BD"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M470 340L510 420L460 450"
            stroke="#FFCD94"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Laptop (Modern dark gray) */}
          <g transform="translate(330, 400) rotate(-4)" style={{ zIndex: 10 }}>
            <rect width="160" height="110" rx="8" fill="#111827" />
            <rect x="4" y="4" width="152" height="102" rx="4" fill="#1F2937" />
            <path d="M70 55L90 55" stroke="white" strokeOpacity="0.1" strokeWidth="2" />
          </g>

          {/* Head */}
          <circle cx="410" cy="190" r="48" fill="url(#skinGrad)" />
          <path
            d="M362 190C362 140 390 120 410 120C430 120 458 140 458 190C458 205 440 215 410 215C380 215 362 205 362 190Z"
            fill="#1E293B"
          />
        </g>

        {/* Floating Artifacts - From Reference Photo */}
        
        {/* Comment Bubbles */}
        <g className="">
          <rect x="580" y="100" width="100" height="40" rx="20" fill="white" filter="url(#softGlow)" />
          <circle cx="605" cy="120" r="14" fill="#E5E7EB" />
          <rect x="625" y="115" width="40" height="4" rx="2" fill="#F3F4F6" />
          <rect x="625" y="125" width="25" height="4" rx="2" fill="#F3F4F6" />
        </g>

        <g className="" style={{ animationDelay: '1.5s' }}>
          <rect x="180" y="240" width="100" height="40" rx="20" fill="white" filter="url(#softGlow)" />
          <circle cx="205" cy="260" r="14" fill="#E5E7EB" />
          <path d="M225 255L235 255M225 265L230 265" stroke="#F3F4F6" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Evaluado Badge - Now with stronger shadow and placed "behind" the laptop area slightly */}
        <g className="">
          <rect x="250" y="400" width="110" height="36" rx="18" fill="white" filter="url(#strongShadow)" />
          <path d="M270 418L273 421L280 414" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="288" y="422" fill="#22C55E" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Avaliado</text>
        </g>

        {/* Small UI dot artifact */}
        <circle cx="700" cy="350" r="6" fill="#F37552" opacity="0.4" />

        <style>{`
          /* Animações removidas para manter o visual estático e limpo conforme solicitado */
        `}</style>
      </svg>
    </div>
  );
};
