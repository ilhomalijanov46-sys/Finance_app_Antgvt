import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import { CurrencyCode } from '../../types';

export interface AnimatedCounterProps {
  value: number;
  isCurrency?: boolean;
  currency?: CurrencyCode;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  isCurrency = true,
  currency,
  className,
  prefix = '',
  suffix = '',
}) => {
  const { format } = useCurrency();
  const { i18n } = useTranslation();
  const jsLocale = i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU';

  // Start at the real value instead of 0. Counting up from zero on the very first render
  // meant every figure in the app displayed a wrong number for about a second after each
  // page load — the animation only makes sense between two values the user has seen.
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 200,
  });

  const display = useTransform(springVal, (latest) => {
    if (isCurrency) {
      return `${prefix}${format(latest, currency)}${suffix}`;
    }
    // Grouping follows the interface language, like every other number in the app.
    return `${prefix}${Math.round(latest).toLocaleString(jsLocale)}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{display}</motion.span>;
};
