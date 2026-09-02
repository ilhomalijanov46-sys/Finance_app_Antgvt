const openDialogIds = new Set<string>();

export const lockScroll = (id?: string) => {
  if (typeof document === 'undefined') return;
  if (id) {
    openDialogIds.add(id);
  }
  document.body.style.overflow = 'hidden';
};

export const unlockScroll = (id?: string) => {
  if (typeof document === 'undefined') return;
  if (id) {
    openDialogIds.delete(id);
  }
  if (openDialogIds.size === 0) {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }
};

export const forceUnlockScroll = (id?: string) => {
  if (typeof document === 'undefined') return;
  if (id) {
    openDialogIds.delete(id);
  } else {
    openDialogIds.clear();
  }
  if (openDialogIds.size === 0) {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }
};
