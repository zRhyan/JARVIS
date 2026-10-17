// packages/web/src/services/intro-config.ts

export type IntroFrequency = 'once_per_day' | 'always' | 'never';

const INTRO_FREQ_KEY = 'jarvis_intro_frequency';
const LAST_INTRO_DATE_KEY = 'jarvis_last_intro_date';

export function getIntroFrequency(): IntroFrequency {
  if (typeof window === 'undefined') return 'once_per_day';
  try {
    const saved = window.localStorage.getItem(INTRO_FREQ_KEY);
    if (saved === 'always' || saved === 'never' || saved === 'once_per_day') {
      return saved;
    }
  } catch {}
  return 'once_per_day';
}

export function setIntroFrequency(freq: IntroFrequency): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INTRO_FREQ_KEY, freq);
  } catch {}
}

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  const freq = getIntroFrequency();
  if (freq === 'never') return false;
  if (freq === 'always') return true;

  // 'once_per_day': Verifica se a última exibição foi hoje
  try {
    const lastDate = window.localStorage.getItem(LAST_INTRO_DATE_KEY);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastDate !== today;
  } catch {
    return true;
  }
}

export function markIntroShownToday(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toISOString().split('T')[0];
    window.localStorage.setItem(LAST_INTRO_DATE_KEY, today);
  } catch {}
}
