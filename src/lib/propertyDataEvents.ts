const propertyDataChangedEvent = 'demi:property-data-changed';

export function notifyPropertyDataChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(propertyDataChangedEvent));
  }
}

export function subscribeToPropertyDataChanges(onChange: () => void): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') onChange();
  };
  window.addEventListener(propertyDataChangedEvent, onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  return () => {
    window.removeEventListener(propertyDataChangedEvent, onChange);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
