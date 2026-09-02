let activeModalCount = 0;

export const lockScroll = () => {
  if (typeof document === 'undefined') return;
  activeModalCount++;
  if (activeModalCount >= 1) {
    document.body.style.overflow = 'hidden';
  }
};

export const unlockScroll = () => {
  if (typeof document === 'undefined') return;
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }
};

export const forceUnlockScroll = () => {
  if (typeof document === 'undefined') return;
  activeModalCount = 0;
  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
};
