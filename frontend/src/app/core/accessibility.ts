const REM_MIN_PX = 12;
const REM_MAX_PX = 20;
const REM_DEFAULT_PX = 16;
const settingsKey = 'sm.akbar42@gmail.com';

export interface AccessibilitySettings {
  remPx: number;
  highContrast: boolean;
}

export const accessibilityLimits = {
  remMin: REM_MIN_PX,
  remMax: REM_MAX_PX,
  remDefault: REM_DEFAULT_PX,
};

export function readAccessibility(): AccessibilitySettings {
  const stored: AccessibilitySettings = { remPx: REM_DEFAULT_PX, highContrast: false };
  const raw = localStorage.getItem(settingsKey);
  if (!raw) {
    return stored;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    const remPx = Number(parsed.remPx);
    if (Number.isFinite(remPx)) {
      stored.remPx = clampRemPx(remPx);
    }
    stored.highContrast = parsed.highContrast === true;
  } catch {
    return stored;
  }
  return stored;
}

export function saveAccessibility(settings: AccessibilitySettings): void {
  const next = {
    remPx: clampRemPx(settings.remPx),
    highContrast: settings.highContrast,
  };
  localStorage.setItem(settingsKey, JSON.stringify(next));
  applyAccessibility(next);
}

export function applyAccessibility(settings: AccessibilitySettings): void {
  document.documentElement.style.fontSize = `${clampRemPx(settings.remPx)}px`;
  document.documentElement.classList.toggle('high-contrast', settings.highContrast);
}

function clampRemPx(value: number): number {
  return Math.min(REM_MAX_PX, Math.max(REM_MIN_PX, Math.round(value)));
}
