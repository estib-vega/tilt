const MOBILE_MAX_WIDTH = 768;

export function hasTouchSupport() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function isMobile() {
  return (
    (window.innerWidth < MOBILE_MAX_WIDTH || screen.width < MOBILE_MAX_WIDTH) &&
    hasTouchSupport()
  );
}
