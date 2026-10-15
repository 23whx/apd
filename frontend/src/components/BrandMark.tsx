import React from 'react';

interface BrandMarkProps {
  className?: string;
  /** Use the simplified mark (no bevel faces, heavier Ψ) for sizes around 24px and below. */
  simple?: boolean;
  title?: string;
}

/** APD logo: bevelled purple hexagon with a green Ψ. Same artwork as public/favicon.svg. */
export const BrandMark: React.FC<BrandMarkProps> = ({ className, simple = false, title }) => (
  <svg
    viewBox="0 0 512 512"
    fill="none"
    className={className}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    <path d="M256 40 L443 148 L443 364 L256 472 L69 364 L69 148 Z" fill="#965FD4" />
    {!simple && (
      <>
        <path d="M256 40 L443 148 L398 174 L256 92 Z" fill="#B48AE6" />
        <path d="M443 148 L443 364 L398 338 L398 174 Z" fill="#A876DF" />
        <path d="M69 148 L256 40 L256 92 L114 174 Z" fill="#8A52CC" />
        <path d="M69 148 L114 174 L114 338 L69 364 Z" fill="#7440B3" />
        <path d="M69 364 L114 338 L256 420 L256 472 Z" fill="#5E3296" />
        <path d="M256 472 L256 420 L398 338 L443 364 Z" fill="#6B3AA6" />
      </>
    )}
    <path d="M256 92 L398 174 L398 338 L256 420 L114 338 L114 174 Z" fill="#121212" />
    <path d="M256 130 V392" stroke="#A8FF60" strokeWidth={simple ? 44 : 36} />
    <path
      d="M172 150 V236 L256 290 L340 236 V150"
      stroke="#A8FF60"
      strokeWidth={simple ? 44 : 36}
      strokeLinejoin="miter"
    />
  </svg>
);
