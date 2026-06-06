import React from 'react';

/**
 * Beinnovo Brand Logo — renders the official uploaded logo.png image.
 */
export default function BeinnovoLogo({ size = 40, variant = 'icon', style = {} }) {
  const isWordmark = variant === 'wordmark';

  return (
    <img
      src="/logo.png"
      alt="Beinnovo"
      width={isWordmark ? size * 4.4 : size}
      height={size}
      style={{
        width: isWordmark ? size * 4.4 : size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}
