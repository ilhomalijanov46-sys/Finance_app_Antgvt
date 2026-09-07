import React from 'react';
import { cn } from '../../utils/cn';

interface AppLogoProps {
  /** Rendered edge length in px. Picks the 96px or 192px file so it stays crisp at 2–3x. */
  size?: number;
  className?: string;
}

/**
 * The app's own icon — the same artwork the home-screen shortcut and the browser tab use
 * (`public/logo-*.png`, generated from `icon.png` in the project root). It replaces the
 * generic gradient-square-with-a-sparkle that stood in for a logo, so the brand is one
 * thing everywhere. Decorative: the product name is always spelled out next to it, so it
 * is hidden from screen readers rather than given a redundant alt text.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ size = 32, className }) => (
  <img
    src={size > 48 ? '/logo-192.png' : '/logo-96.png'}
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={cn('shrink-0 select-none object-contain', className)}
  />
);
