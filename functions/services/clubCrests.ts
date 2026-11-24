// Fallback club crests for teams missing logos in ESPN API
export const SC_DELHI_LOGO = 'https://xtra-byd.pages.dev/logos/sc-delhi.svg';
export const INTER_KASHI_LOGO = 'https://xtra-byd.pages.dev/logos/inter-kashi.svg';
export const CHANMARI_FC_LOGO = 'https://xtra-byd.pages.dev/logos/chanmari-fc.svg';
export const SHILLONG_LAJONG_LOGO = 'https://xtra-byd.pages.dev/logos/shillong-lajong.svg';
export const DEMPO_SC_LOGO = 'https://xtra-byd.pages.dev/logos/dempo-sc.png';
export const RAJASTHAN_UNITED_LOGO = 'https://xtra-byd.pages.dev/logos/rajasthan-united.png';
export const SREENIDI_DECCAN_LOGO = 'https://images.fotmob.com/image_resources/logo/teamlogo/1320491_small.png';

export function resolveTeamLogo(name: string, logo?: string | null): string {
  const lower = (name || '').toLowerCase().trim();
  if (
    lower.includes('sporting club delhi') ||
    lower.includes('sc delhi') ||
    lower.includes('sporting delhi') ||
    lower.includes('delhi fc') ||
    lower === 'delhi'
  ) {
    return SC_DELHI_LOGO;
  }
  if (
    lower.includes('inter kashi') ||
    lower.includes('kashi')
  ) {
    return INTER_KASHI_LOGO;
  }
  if (lower.includes('chanmari')) {
    return CHANMARI_FC_LOGO;
  }
  if (lower.includes('shillong lajong') || lower.includes('lajong')) {
    return SHILLONG_LAJONG_LOGO;
  }
  if (lower.includes('dempo')) {
    return DEMPO_SC_LOGO;
  }
  if (lower.includes('rajasthan') || lower.includes('rufc')) {
    return RAJASTHAN_UNITED_LOGO;
  }
  if (lower.includes('sreenidi') || lower.includes('deccan')) {
    return SREENIDI_DECCAN_LOGO;
  }
  if (logo && logo.trim().length > 0) return logo.trim();
  return '';
}
