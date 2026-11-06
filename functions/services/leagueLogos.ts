export function resolveLeagueLogo(league: string): string {
  const l = (league || '').toLowerCase().trim();
  if (l.includes('premier') || l === 'pl' || l === 'epl') {
    return 'https://xtra-byd.pages.dev/logos/pl.png';
  }
  if (l.includes('champions') || l.includes('ucl') || l === 'uefa') {
    return 'https://xtra-byd.pages.dev/logos/ucl.png';
  }
  if (l.includes('super league') || l === 'isl') {
    return 'https://xtra-byd.pages.dev/logos/isl.png';
  }
  if (l.includes('football league') || l.includes('i-league') || l === 'ifl' || l === 'il') {
    return 'https://xtra-byd.pages.dev/logos/ifl.png';
  }
  if (l.includes('la liga') || l.includes('laliga') || l === 'll') {
    return 'https://xtra-byd.pages.dev/logos/ll.png';
  }
  if (l.includes('bundesliga') || l === 'bl') {
    return 'https://xtra-byd.pages.dev/logos/bl.png';
  }
  if (l.includes('serie a') || l.includes('serie') || l === 'sa') {
    return 'https://xtra-byd.pages.dev/logos/sa.png';
  }
  return 'https://xtra-byd.pages.dev/logos/pl.png';
}
