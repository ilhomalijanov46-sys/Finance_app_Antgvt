import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
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
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 200,
  });

  const display = useTransform(springVal, (latest) => {
    if (isCurrency) {
      return format(latest, currency);
    }
    return `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{display}</motion.span>;
};
