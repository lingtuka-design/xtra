import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Download,
  RefreshCw,
  Sparkles,
  Filter,
  Copy,
  Sliders,
  Calendar,
  Table as TableIcon,
  Palette,
  Layers,
} from 'lucide-react';
import { toPng } from 'html-to-image';

// Official Inkhel Vector SVG (exact as used in Fixtures)
const InkhelSvgLogo = () => (
  <svg
    width="160"
    height="42"
    viewBox="0 0 6683 1858"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
  >
    <g transform="matrix(1,0,0,1,-8972.54,-259.853)">
      <g transform="matrix(1,0,0,1,8414.76,104.994)">
        <g transform="matrix(4.16667,0,0,4.16667,3652.43,948.396)">
          <g id="Layer-1">
            <path
              d="M0,64.872L51.933,24.363L29.641,98.383L0,64.872ZM-579.209,-190.449C-616.988,-190.449 -647.724,-159.71 -647.724,-121.927C-647.724,-92.056 -628.504,-66.588 -601.784,-57.235L-682.145,-23.743L-742.717,1.505L-679.427,18.841L-644.472,28.42L-645.195,107.513L-645.241,112.362L-643.287,116.807L-606.952,199.37L-582.329,255.321L-564.698,196.788L-552.394,155.945L-490.23,155.945C-489.806,155.959 -489.242,155.974 -488.552,155.974C-481.012,155.974 -461.705,154.425 -445.278,140.084C-430.359,127.057 -425.537,112.744 -424.301,108.098L-420.395,95.014L-378.813,147.408L-372.039,155.945L-294.525,155.945C-294.02,155.966 -293.416,155.98 -292.72,155.98C-288.985,155.98 -281.952,155.532 -273.559,152.839L-274.494,155.945L-180.832,155.945C-180.612,155.948 -180.337,155.952 -180.01,155.952C-174.514,155.952 -155.29,154.894 -138.627,141.275C-131.556,135.497 -126.626,129.354 -123.208,123.846L-103.53,147.73L-96.762,155.945L12.312,155.945L12.297,155.986L42.699,155.945L80.557,155.945L80.507,155.893L105.834,155.858C106.387,155.883 107.06,155.899 107.837,155.899C114.396,155.899 131.448,154.492 148.041,141.408C163.96,128.861 169.255,112.969 170.538,108.217L174.714,94.423L196.469,94.423L186.653,126.844L177.835,155.945L271.383,155.945C271.655,155.952 271.998,155.959 272.41,155.959C276.147,155.959 283.333,155.524 291.842,152.863L290.863,156.113L524.866,156.113C525.182,156.121 525.581,156.127 526.053,156.127C529.159,156.127 536.539,155.773 545.521,152.919L544.607,155.945L783.833,155.945C784.046,155.948 784.316,155.952 784.634,155.952C790.115,155.952 809.327,154.866 826.438,140.893C841.958,128.224 847.29,112.538 848.466,108.437L852.241,96.002L861.094,66.88L715.319,66.88L740.883,-18.329L749.592,-47.373L656.545,-47.373C656.118,-47.388 655.571,-47.4 654.917,-47.4C651.134,-47.4 644.04,-46.947 635.599,-44.235L636.493,-47.205L402.629,-47.205C402.127,-47.226 401.522,-47.241 400.819,-47.241C397.088,-47.241 390.179,-46.799 381.957,-44.199L382.91,-47.373L289.69,-47.373C289.23,-47.39 288.688,-47.402 288.068,-47.402C281.76,-47.402 265.301,-46.084 248.758,-33.874C231.591,-21.2 225.816,-3.542 224.539,1.13L220.637,14.149L198.843,14.149L208.586,-18.329L217.299,-47.373L123.82,-47.373C123.664,-47.375 123.466,-47.376 123.232,-47.376C123.053,-47.376 122.853,-47.375 122.64,-47.373L-49.462,-47.373L-55.65,-42.407L-75.642,-26.364L-69.268,-47.373L-162.653,-47.373C-163.076,-47.388 -163.616,-47.399 -164.265,-47.399C-168.087,-47.399 -175.244,-46.94 -183.743,-44.199L-182.787,-47.373L-274.65,-47.373C-274.995,-47.381 -275.446,-47.392 -275.995,-47.392C-283.147,-47.392 -301.598,-45.965 -318.421,-32.766C-332.627,-21.621 -338.371,-7.765 -340.335,-1.62L-368.453,-38.492L-375.226,-47.373L-471.003,-47.373C-471.332,-47.381 -471.753,-47.388 -472.261,-47.388C-476.185,-47.388 -483.557,-46.94 -492.102,-44.221L-485.632,-65.695L-471.869,-111.386L-515.914,-93.028L-517.381,-92.417C-513.096,-101.357 -510.694,-111.366 -510.694,-121.927C-510.694,-159.71 -541.429,-190.449 -579.209,-190.449M447.044,36.72L504.19,36.652L509.493,19.4L452.283,19.4L447.044,36.72M400.819,-24.68C401.613,-24.68 402.051,-24.644 402.051,-24.644L606.144,-24.644L586.61,40.274C586.61,40.274 583.409,51.883 573.435,60.722C561.575,71.236 548.582,72.059 544.818,72.059C544.12,72.059 543.743,72.03 543.743,72.03L436.44,72.03L431.164,89.607L571.783,89.607L567.917,102.396C567.917,102.396 564.551,114.143 554.619,122.61C542.562,132.892 529.321,133.567 526.053,133.567C525.564,133.567 525.297,133.55 525.297,133.55L321.217,133.55L359.19,7.448C359.19,7.448 362.188,-4.874 373.314,-14.179C384.878,-23.848 396.987,-24.68 400.819,-24.68M-275.995,-24.83C-275.406,-24.83 -275.085,-24.811 -275.085,-24.811L-213.142,-24.811L-251.396,102.237C-251.396,102.237 -254.841,114.645 -265.711,123.384C-277.203,132.618 -288.978,133.417 -292.72,133.417C-293.508,133.417 -293.939,133.385 -293.939,133.385L-361.141,133.385L-429.631,47.082L-446.045,102.062C-446.045,102.062 -448.523,112.965 -460.114,123.089C-471.072,132.653 -484.553,133.413 -488.552,133.413C-489.307,133.413 -489.722,133.385 -489.722,133.385L-552.322,133.385L-514.35,7.281C-514.35,7.281 -511.477,-4.941 -498.969,-15.296C-488.209,-24.205 -475.579,-24.827 -472.261,-24.827C-471.723,-24.827 -471.431,-24.811 -471.431,-24.811L-386.394,-24.811L-331.438,47.254L-319.172,6.374C-319.172,6.374 -316.179,-5.849 -304.496,-15.015C-292.82,-24.177 -279.542,-24.83 -275.995,-24.83M-164.265,-24.837C-163.582,-24.837 -163.209,-24.811 -163.209,-24.811L-99.69,-24.811L-118.408,36.884L-41.53,-24.811L78.292,-24.811L-32.798,61.843L30.48,133.385L-86.118,133.385L-131.004,78.904L-138.007,102.092C-138.007,102.092 -140.421,113.605 -152.904,123.808C-164.027,132.894 -177.261,133.389 -180.01,133.389C-180.345,133.389 -180.525,133.385 -180.525,133.385L-244.139,133.385L-206.183,7.332C-206.183,7.332 -202.969,-5.284 -191.922,-14.412C-180.227,-24.072 -167.886,-24.837 -164.265,-24.837M654.917,-24.839C655.607,-24.839 655.981,-24.811 655.981,-24.811L719.273,-24.811L684.996,89.442L830.658,89.442L826.813,102.088C826.813,102.088 823.574,114.106 812.17,123.418C800.575,132.888 787.327,133.389 784.634,133.389C784.312,133.389 784.141,133.385 784.141,133.385L574.965,133.385L612.721,8.003C612.721,8.003 615.803,-4.976 627.52,-14.562C639.146,-24.075 651.313,-24.839 654.917,-24.839M288.068,-24.841C288.768,-24.841 289.147,-24.811 289.147,-24.811L352.554,-24.811L314.305,102.214C314.305,102.214 311.612,114.813 298.206,124.701C287.129,132.871 275.278,133.396 272.41,133.396C271.983,133.396 271.759,133.385 271.759,133.385L208.243,133.385L226.877,71.861L157.976,71.861L148.817,102.092C148.817,102.092 145.848,114.411 134.074,123.692C122.885,132.51 111.662,133.34 107.837,133.34C106.948,133.34 106.458,133.294 106.458,133.294L42.667,133.385L80.637,7.278C80.637,7.278 83.733,-5.8 96.642,-15.751C107.875,-24.417 120.931,-24.816 123.232,-24.816C123.466,-24.816 123.588,-24.811 123.588,-24.811L186.975,-24.811L168.521,36.713L237.422,36.713L246.25,7.278C246.25,7.278 249.469,-6.354 262.157,-15.722C273.551,-24.129 284.643,-24.841 288.068,-24.841M-507.236,-72.204L-586.3,190.286L-622.635,107.719L-621.751,11.251L-673.467,-2.916L-507.236,-72.204M-579.209,-167.887C-553.826,-167.887 -533.255,-147.313 -533.255,-121.927C-533.255,-96.555 -553.826,-75.977 -579.209,-75.977C-604.587,-75.977 -625.162,-96.555 -625.162,-121.927C-625.162,-147.313 -604.587,-167.887 -579.209,-167.887"
              style={{ fill: 'white', fillRule: 'nonzero' }}
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
);

interface TableMakerPanelProps {
  onPostCreated?: (silent?: boolean) => Promise<void>;
  onSwitchMode?: (mode: 'stats' | 'fixtures' | 'table') => void;
}

export interface StandingsTeam {
  id: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
}

export interface StandingsRow {
  rank: number;
  team: StandingsTeam;
  p: number; // Played
  w: number; // Won
  d: number; // Drawn
  l: number; // Lost
  pts: number; // Points
  selected: boolean;
  zoneColor?: string;
  zoneDescription?: string;
}

interface LeagueOption {
  id: string; // ESPN league code e.g. eng.1
  name: string;
  tag: string;
  logo: string;
  country: string;
  accentColor: string;
  totalTeams: number;
}

const SUPPORTED_LEAGUES: LeagueOption[] = [
  {
    id: 'eng.1',
    name: 'Premier League',
    tag: 'PREMIER LEAGUE',
    logo: 'https://xtra-byd.pages.dev/logos/pl.png',
    country: 'England',
    accentColor: '#38003C',
    totalTeams: 20,
  },
  {
    id: 'ind.1',
    name: 'ISL (Indian Super League)',
    tag: 'INDIAN SUPER LEAGUE',
    logo: 'https://xtra-byd.pages.dev/logos/isl.png',
    country: 'India',
    accentColor: '#0A2342',
    totalTeams: 13,
  },
  {
    id: 'esp.1',
    name: 'La Liga',
    tag: 'LA LIGA',
    logo: 'https://xtra-byd.pages.dev/logos/ll.png',
    country: 'Spain',
    accentColor: '#1A213D',
    totalTeams: 20,
  },
  {
    id: 'ger.1',
    name: 'Bundesliga',
    tag: 'BUNDESLIGA',
    logo: 'https://xtra-byd.pages.dev/logos/bl.png',
    country: 'Germany',
    accentColor: '#2B0E12',
    totalTeams: 18,
  },
  {
    id: 'ita.1',
    name: 'Serie A',
    tag: 'SERIE A',
    logo: 'https://xtra-byd.pages.dev/logos/sa.png',
    country: 'Italy',
    accentColor: '#051937',
    totalTeams: 20,
  },
];

// Helper to shorten long team names for clean graphics presentation
export function shortenClubName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  const exactMap: Record<string, string> = {
    // Premier League
    'manchester united': 'Man United',
    'manchester city': 'Man City',
    'brighton & hove albion': 'Brighton',
    'brighton and hove albion': 'Brighton',
    'afc bournemouth': 'Bournemouth',
    'tottenham hotspur': 'Tottenham',
    'wolverhampton wanderers': 'Wolves',
    'wolverhampton': 'Wolves',
    'west ham united': 'West Ham',
    'newcastle united': 'Newcastle',
    'nottingham forest': 'Nottm Forest',
    'sheffield united': 'Sheff Utd',
    'sheffield wednesday': 'Sheff Wed',
    'queens park rangers': 'QPR',
    'ipswich town': 'Ipswich',
    'coventry city': 'Coventry',
    'hull city': 'Hull',
    'leeds united': 'Leeds',
    'leicester city': 'Leicester',
    'norwich city': 'Norwich',
    'stoke city': 'Stoke',
    'swansea city': 'Swansea',
    'cardiff city': 'Cardiff',
    'bristol city': 'Bristol',
    'luton town': 'Luton',
    'huddersfield town': 'Huddersfield',

    // ISL
    'mohun bagan super giant': 'Mohun Bagan',
    'mohun bagan sg': 'Mohun Bagan',
    'northeast united fc': 'NorthEast United',
    'northeast united': 'NorthEast United',
    'bengaluru fc': 'Bengaluru',
    'bengaluru': 'Bengaluru',
    'punjab fc': 'Punjab',
    'east bengal fc': 'East Bengal',
    'east bengal': 'East Bengal',
    'fc goa': 'Goa',
    'kerala blasters fc': 'Kerala Blasters',
    'kerala blasters': 'Kerala Blasters',
    'sporting club delhi': 'SC Delhi',
    'mumbai city fc': 'Mumbai City',
    'mumbai city': 'Mumbai City',
    'odisha fc': 'Odisha',
    'chennaiyin fc': 'Chennaiyin',
    'hyderabad fc': 'Hyderabad',
    'jamshedpur fc': 'Jamshedpur',
    'mohammedan sc': 'Mohammedan',

    // Bundesliga
    'borussia mönchengladbach': "M'gladbach",
    'borussia moenchengladbach': "M'gladbach",
    'borussia dortmund': 'Dortmund',
    'bayer leverkusen': 'Leverkusen',
    'eintracht frankfurt': 'Frankfurt',
    '1. fc union berlin': 'Union Berlin',
    'fc cologne': 'FC Köln',
    '1. fc köln': 'FC Köln',
    'sc paderborn 07': 'Paderborn',
    'sv elversberg': 'Elversberg',
    'tsg hoffenheim': 'Hoffenheim',
    'vfb stuttgart': 'Stuttgart',
    'sc freiburg': 'Freiburg',
    'fc augsburg': 'Augsburg',
    'hamburg sv': 'Hamburg',
    'schalke 04': 'Schalke',

    // Serie A
    'internazionale': 'Inter Milan',
    'hellas verona': 'Verona',

    // La Liga
    'athletic club': 'Athletic Bilbao',
  };

  if (exactMap[lower]) {
    return exactMap[lower];
  }

  // Strip generic suffixes if name is long
  const cleaned = trimmed
    .replace(/\s+FC$/i, '')
    .replace(/^FC\s+/i, '')
    .replace(/\s+AFC$/i, '')
    .replace(/^AFC\s+/i, '');

  return cleaned;
}

export const TableMakerPanel: React.FC<TableMakerPanelProps> = ({ onSwitchMode }) => {
  // Navigation mode switcher
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('eng.1');
  const [customTitle, setCustomTitle] = useState<string>('PREMIER LEAGUE');
  const [customSubtitle, setCustomSubtitle] = useState<string>('STANDINGS • 2026/27');

  // Rows and data state
  const [rows, setRows] = useState<StandingsRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & scope
  const [scopeFilter, setScopeFilter] = useState<'all' | 'top4' | 'top6' | 'top10' | 'relegation'>('all');

  // Appearance & Styling
  const [brandLogo, setBrandLogo] = useState<'fb' | 'wa'>('fb');
  const [themeStyle, setThemeStyle] = useState<'option1' | 'dark' | 'league'>('option1');

  // Export & Action Notice
  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentLeague = useMemo(() => {
    return SUPPORTED_LEAGUES.find((l) => l.id === selectedLeagueId) || SUPPORTED_LEAGUES[0];
  }, [selectedLeagueId]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Resize observer to keep 820px preview scaled to fit container
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        setPreviewScale(Math.min(1, containerWidth / 820));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Fetch standings from ESPN API
  const fetchStandings = async (leagueId: string) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ESPN standings API`);
      }
      const data = (await res.json()) as any;
      const rawEntries = data?.children?.[0]?.standings?.entries || [];

      if (rawEntries.length === 0) {
        throw new Error('ESPN table data a la in-update lo a nih hmel.');
      }

      const totalTeams = rawEntries.length;

      const parsed: StandingsRow[] = rawEntries.map((e: any, idx: number) => {
        const statsMap: Record<string, any> = {};
        (e.stats || []).forEach((s: any) => {
          statsMap[s.name] = s.displayValue ?? s.value;
        });

        const rankNum = parseInt(statsMap['rank'] ?? String(idx + 1), 10) || idx + 1;
        const pNum = parseInt(statsMap['gamesPlayed'] ?? '0', 10);
        const wNum = parseInt(statsMap['wins'] ?? '0', 10);
        const dNum = parseInt(statsMap['ties'] ?? '0', 10);
        const lNum = parseInt(statsMap['losses'] ?? '0', 10);
        const ptsNum = parseInt(statsMap['points'] ?? '0', 10);

        // Qualification / Relegation Zone Color
        let zoneColor: string | undefined;
        let zoneDescription: string | undefined;

        if (leagueId === 'eng.1' || leagueId === 'esp.1' || leagueId === 'ita.1') {
          if (rankNum <= 4) {
            zoneColor = '#00E887'; // Champions League
            zoneDescription = 'Champions League';
          } else if (rankNum === 5) {
            zoneColor = '#FB923C'; // Europa League
            zoneDescription = 'Europa League';
          } else if (rankNum >= totalTeams - 2) {
            zoneColor = '#EF4444'; // Relegation
            zoneDescription = 'Relegation Zone';
          }
        } else if (leagueId === 'ger.1') {
          if (rankNum <= 4) {
            zoneColor = '#00E887';
            zoneDescription = 'Champions League';
          } else if (rankNum === 5) {
            zoneColor = '#FB923C';
            zoneDescription = 'Europa League';
          } else if (rankNum === 16) {
            zoneColor = '#F59E0B';
            zoneDescription = 'Playoff';
          } else if (rankNum >= 17) {
            zoneColor = '#EF4444';
            zoneDescription = 'Relegation Zone';
          }
        } else if (leagueId === 'ind.1') {
          if (rankNum <= 2) {
            zoneColor = '#00E887'; // ISL Semi-Finals
            zoneDescription = 'Semi-Finals';
          } else if (rankNum <= 6) {
            zoneColor = '#38BDF8'; // ISL Knockouts
            zoneDescription = 'Knockouts';
          }
        }

        const rawTeamName = e.team?.displayName || e.team?.name || 'Club';
        const cleanedName = shortenClubName(rawTeamName);

        return {
          rank: rankNum,
          team: {
            id: String(e.team?.id || idx),
            name: rawTeamName,
            displayName: cleanedName,
            shortDisplayName: e.team?.shortDisplayName || cleanedName,
            abbreviation: e.team?.abbreviation || 'FC',
            logo: e.team?.logos?.[0]?.href || '',
          },
          p: pNum,
          w: wNum,
          d: dNum,
          l: lNum,
          pts: ptsNum,
          selected: true,
          zoneColor,
          zoneDescription,
        };
      });

      // Sort by rank ascending
      parsed.sort((a, b) => a.rank - b.rank);

      setRows(parsed);
      showNotice(`${currentLeague.name} Table lak fel a ni e! (${parsed.length} teams)`);
    } catch (err: any) {
      console.error('ESPN Standings error:', err);
      setFetchError(err.message || 'Error fetching standings from ESPN');
    } finally {
      setIsLoading(false);
    }
  };

  // On league switch, auto fetch and update title
  useEffect(() => {
    const lg = SUPPORTED_LEAGUES.find((l) => l.id === selectedLeagueId);
    if (lg) {
      setCustomTitle(lg.tag);
      setCustomSubtitle('STANDINGS • 2026/27');
    }
    fetchStandings(selectedLeagueId);
  }, [selectedLeagueId]);

  // Filtered rows for the live graphic preview
  const displayedRows = useMemo(() => {
    const total = rows.length;
    if (total === 0) return [];

    let filtered = [...rows];
    if (scopeFilter === 'top4') {
      filtered = filtered.slice(0, 4);
    } else if (scopeFilter === 'top6') {
      filtered = filtered.slice(0, 6);
    } else if (scopeFilter === 'top10') {
      filtered = filtered.slice(0, 10);
    } else if (scopeFilter === 'relegation') {
      filtered = filtered.slice(Math.max(0, total - 4));
    }

    return filtered.filter((r) => r.selected);
  }, [rows, scopeFilter]);

  // Toggle row selection
  const handleToggleRow = (rank: number) => {
    setRows((prev) =>
      prev.map((r) => (r.rank === rank ? { ...r, selected: !r.selected } : r))
    );
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // 1-Click HD Download using html-to-image
  const handleDownloadHd = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const fileName = `${customTitle.trim().replace(/\s+/g, '_')}_Table_${brandLogo === 'fb' ? 'Xtra' : 'Inkhel'}.png`.replace(
        /[^a-zA-Z0-9-_\.]/g,
        '_'
      );

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        includeQueryParams: true,
        cacheBust: false,
      });

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      showNotice('HD League Table Card download fel a ni e!');
    } catch (err: any) {
      console.error('Download error:', err);
      showNotice('Download theih loh: ' + (err.message || 'Canvas error'));
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showNotice('Image hi clipboard-ah copy fel a ni ta!');
    } catch (err: any) {
      showNotice('Clipboard-ah copy theih loh: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Graphic Mode Switcher (Stats Card vs Fixtures vs Table) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <span>Graphic Studio</span>
              <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full border border-stone-200">
                HD Generator
              </span>
            </h2>
            <p className="text-xs text-stone-500">Thlan tur: Stats Card, Fixtures emaw League Table Graphic</p>
          </div>
        </div>

        {/* Dropdown / Segmented Toggle */}
        <div className="flex items-center gap-2">
          {/* Dropdown Menu for Mobile */}
          <div className="sm:hidden relative">
            <select
              value="table"
              onChange={(e) => {
                const val = e.target.value as 'stats' | 'fixtures' | 'table';
                if (onSwitchMode) onSwitchMode(val);
              }}
              className="bg-[#EFECE6] border border-stone-300 font-bold text-xs py-1.5 pl-3 pr-8 rounded-xl text-stone-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="stats">📊 Stats Card</option>
              <option value="fixtures">📅 Fixtures</option>
              <option value="table">🏆 League Table</option>
            </select>
          </div>

          {/* Desktop Segmented Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#EFECE6] p-1 rounded-xl border border-stone-300/80">
            <button
              type="button"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('stats');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-stone-500" />
              <span>Stats Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('fixtures');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Fixtures</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('table');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 bg-amber-500 text-stone-950 shadow-xs cursor-pointer"
            >
              <TableIcon className="w-3.5 h-3.5 text-stone-950" />
              <span>League Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area: Left Editor Column, Right Live Preview Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: League Standings Puller & Customization Controls (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. League Selection Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>1. Select League</span>
              </h3>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                Live ESPN Standings
              </span>
            </div>

            {/* League Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_LEAGUES.map((lg) => {
                const isSelected = selectedLeagueId === lg.id;
                return (
                  <button
                    key={lg.id}
                    onClick={() => setSelectedLeagueId(lg.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 text-stone-950 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    <img
                      src={lg.logo}
                      alt={lg.name}
                      className="w-7 h-7 object-contain drop-shadow-sm flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold truncate text-[13px]">{lg.name}</div>
                      <div className="text-[10px] text-stone-400 font-semibold">{lg.country}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchStandings(selectedLeagueId)}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {isLoading ? 'ESPN Standings Lakkhawm Mek A Ni...' : 'Refresh Standings Table (ESPN)'}
              </span>
            </button>
            {fetchError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                {fetchError}
              </p>
            )}
          </div>

          {/* 2. Filter Scope & Custom Titles */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <Filter className="w-4 h-4 text-stone-600" />
              <span>2. Table Rows & Custom Titles</span>
            </h3>

            {/* Scope Filter Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Team Zat / Range Thlang Rawh
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'all', label: 'All Teams' },
                  { id: 'top4', label: 'Top 4' },
                  { id: 'top6', label: 'Top 6' },
                  { id: 'top10', label: 'Top 10' },
                  { id: 'relegation', label: 'Bottom 4' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScopeFilter(s.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                      scopeFilter === s.id
                        ? 'bg-amber-500 text-stone-950 shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Subtitle Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Card Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Card Subtitle
                </label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Appearance, Background Theme & Branding */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <Palette className="w-4 h-4 text-purple-600" />
              <span>3. Background Style & Brand Logo</span>
            </h3>

            {/* Theme Selector */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Card Background Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeStyle('option1')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                    themeStyle === 'option1'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-950 font-black'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="w-full h-5 rounded-md bg-[#5F779B] border border-stone-300 shadow-xs" />
                  <span>Option 1 (Steel Blue)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeStyle('dark')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                    themeStyle === 'dark'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-950 font-black'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div className="w-full h-5 rounded-md bg-[#161B22] border border-stone-800 shadow-xs" />
                  <span>Deep Dark Slate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeStyle('league')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                    themeStyle === 'league'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-950 font-black'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <div
                    className="w-full h-5 rounded-md border shadow-xs"
                    style={{ backgroundColor: currentLeague.accentColor }}
                  />
                  <span>League Theme</span>
                </button>
              </div>
            </div>

            {/* Brand Logo Selection */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Brand Logo (Bottom Center)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBrandLogo('fb')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    brandLogo === 'fb'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-950 font-black'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <span>Inkhel Xtra</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded">
                    Facebook
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBrandLogo('wa')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    brandLogo === 'wa'
                      ? 'border-amber-500 bg-amber-50/50 text-stone-950 font-black'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <span>Inkhel (Standard)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded">
                    WhatsApp
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Team Row Visibility Toggles */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-600" />
                <span>4. Individual Team Toggles ({rows.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-[11px] font-bold text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
              {rows.map((r) => (
                <div
                  key={r.rank}
                  onClick={() => handleToggleRow(r.rank)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    r.selected
                      ? 'border-stone-200 bg-stone-50/80 text-stone-900 font-bold'
                      : 'border-dashed border-stone-200 text-stone-400 bg-white opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-extrabold text-stone-500">{r.rank}</span>
                    {r.team.logo && (
                      <img src={r.team.logo} alt={r.team.name} className="w-5 h-5 object-contain" />
                    )}
                    <span>{r.team.displayName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-stone-500">
                    <span>P: {r.p}</span>
                    <span>W: {r.w}</span>
                    <span>D: {r.d}</span>
                    <span>L: {r.l}</span>
                    <span className="font-extrabold text-stone-900">PTS: {r.pts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Graphic Card Studio Preview (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs sticky top-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <span className="text-xs font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Table Preview</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {displayedRows.length} Teams Visible
              </span>
            </div>

            {/* Scaled Preview Wrapper */}
            <div
              ref={previewContainerRef}
              className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-stone-900/5 p-2"
              style={{ minHeight: '520px' }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  width: '820px',
                  marginBottom: `-${(1 - previewScale) * 980}px`,
                }}
              >
                {/* THE ACTUAL HIGH RESOLUTION RENDER TARGET (820px Canvas) */}
                <div
                  ref={cardRef}
                  className="w-[820px] rounded-3xl overflow-hidden relative shadow-2xl select-none"
                  style={{
                    backgroundColor:
                      themeStyle === 'option1'
                        ? '#5F779B'
                        : themeStyle === 'dark'
                        ? '#141820'
                        : currentLeague.accentColor,
                    backgroundImage:
                      themeStyle === 'option1'
                        ? `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.22) 100%), repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1.5px, transparent 1.5px, transparent 28px)`
                        : themeStyle === 'dark'
                        ? `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.45) 100%)`
                        : `radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.07) 0%, rgba(0, 0, 0, 0.35) 100%), repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.025) 0px, rgba(255, 255, 255, 0.025) 1.5px, transparent 1.5px, transparent 28px)`,
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    padding: '36px 36px 42px 36px',
                  }}
                >
                  {/* Top League Official Silhouette / White Logo */}
                  <div className="flex flex-col items-center justify-center text-center mb-5">
                    <img
                      src={currentLeague.logo}
                      alt={currentLeague.name}
                      className="h-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] mb-2.5"
                    />
                    <h1
                      className="text-[34px] font-black uppercase text-white tracking-wider leading-none"
                      style={{
                        letterSpacing: '1.5px',
                        textShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
                        fontFamily: "'Fredoka', 'Impact', sans-serif",
                      }}
                    >
                      {customTitle}
                    </h1>
                    <div
                      className="text-[13px] font-extrabold uppercase text-white/80 tracking-widest mt-1.5"
                      style={{ letterSpacing: '2px', textShadow: '0 2px 5px rgba(0,0,0,0.4)' }}
                    >
                      {customSubtitle}
                    </div>
                  </div>

                  {/* STANDINGS TABLE CARD CONTAINER */}
                  <div className="bg-black/25 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                    {/* Table Column Headers (P, W, D, L, PTS closely grouped on right with bold styling) */}
                    <div className="flex items-center px-5 py-3 bg-black/40 border-b border-white/10 text-white/80 text-[13px] font-black uppercase tracking-wider">
                      <div className="w-10 text-center">POS</div>
                      <div className="flex-1 pl-4">CLUB</div>
                      <div className="flex items-center gap-2 sm:gap-3 text-right pr-2">
                        <div className="w-11 text-center font-black">P</div>
                        <div className="w-11 text-center font-black">W</div>
                        <div className="w-11 text-center font-black">D</div>
                        <div className="w-11 text-center font-black">L</div>
                        <div className="w-16 text-center font-black text-amber-300">PTS</div>
                      </div>
                    </div>

                    {/* Table Rows List */}
                    {displayedRows.length === 0 ? (
                      <div className="py-16 text-center text-white/60 text-sm font-bold">
                        {isLoading ? 'Table a in-load mek...' : 'Team thlan a awm lo.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {displayedRows.map((row, idx) => {
                          const isEven = idx % 2 === 0;
                          return (
                            <div
                              key={row.rank}
                              className={`flex items-center px-5 py-3 relative transition-colors ${
                                isEven ? 'bg-white/[0.04]' : 'bg-transparent'
                              }`}
                            >
                              {/* Left Zone Indicator Bar */}
                              {row.zoneColor && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-[5px]"
                                  style={{ backgroundColor: row.zoneColor }}
                                />
                              )}

                              {/* Rank POS */}
                              <div className="w-10 flex items-center justify-center">
                                <span
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[15px] font-black"
                                  style={{
                                    backgroundColor: row.zoneColor
                                      ? `${row.zoneColor}30`
                                      : 'rgba(255,255,255,0.08)',
                                    color: row.zoneColor || '#FFFFFF',
                                    border: row.zoneColor
                                      ? `1px solid ${row.zoneColor}60`
                                      : '1px solid rgba(255,255,255,0.12)',
                                  }}
                                >
                                  {row.rank}
                                </span>
                              </div>

                              {/* Club Crest & Name */}
                              <div className="flex-1 flex items-center gap-3.5 pl-4 min-w-0 pr-2">
                                {row.team.logo ? (
                                  <img
                                    src={row.team.logo}
                                    alt={row.team.displayName}
                                    className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                    ⚽
                                  </div>
                                )}
                                <span className="font-black text-[18px] sm:text-[19px] text-white truncate drop-shadow-sm tracking-tight">
                                  {row.team.displayName}
                                </span>
                              </div>

                              {/* Stats Columns: P, W, D, L, PTS (Large legible font, closely grouped) */}
                              <div className="flex items-center gap-2 sm:gap-3 text-right pr-2">
                                <div className="w-11 text-center font-bold text-[18px] text-white/95">
                                  {row.p}
                                </div>
                                <div className="w-11 text-center font-bold text-[18px] text-white/90">
                                  {row.w}
                                </div>
                                <div className="w-11 text-center font-bold text-[18px] text-white/90">
                                  {row.d}
                                </div>
                                <div className="w-11 text-center font-bold text-[18px] text-white/90">
                                  {row.l}
                                </div>

                                {/* Points Highlight */}
                                <div className="w-16 flex items-center justify-center">
                                  <span
                                    className="inline-block px-3 py-1 rounded-lg font-black text-[18px] bg-white/20 text-white shadow-xs border border-white/25"
                                    style={{
                                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                  >
                                    {row.pts}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer Branding Logo */}
                  <div className="relative z-10 flex flex-col items-center justify-center mt-7">
                    <div className="flex items-center justify-center scale-95">
                      <InkhelSvgLogo />
                    </div>
                    {brandLogo === 'fb' && (
                      <div
                        className="text-[16px] font-extrabold text-white -mt-1"
                        style={{
                          letterSpacing: '0.6px',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        Xtra
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Download & Copy */}
            <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
              <button
                type="button"
                onClick={handleDownloadHd}
                disabled={isDownloading || displayedRows.length === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>
                  {isDownloading ? 'Graphic Siam Mek A Ni...' : 'Download HD League Table Card (PNG)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isDownloading || displayedRows.length === 0}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Image to Clipboard</span>
              </button>

              {actionNotice && (
                <div className="mt-2 text-center text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {actionNotice}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
