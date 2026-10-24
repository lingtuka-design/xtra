import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Download,
  Calendar,
  Sparkles,
  Trophy,
  RefreshCw,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sliders,
  ChevronDown,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface FixturesMakerPanelProps {
  onPostCreated?: (silent?: boolean) => Promise<void>;
  onSwitchMode?: (mode: 'stats' | 'fixtures') => void;
}

export interface FixtureMatch {
  id: string;
  utcDate: string;
  istDateFormatted: string; // e.g. "SATURDAY, 24 OCTOBER 2026"
  istDateSortKey: string;   // e.g. "2026-10-24"
  istTime: string;          // e.g. "7:30 PM"
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  selected: boolean;
}

const SUPPORTED_LEAGUES = [
  { id: 'eng.1', name: 'Premier League', tag: 'PREMIER LEAGUE', icon: '🦁' },
  { id: 'esp.1', name: 'La Liga', tag: 'LA LIGA', icon: '🇪🇸' },
  { id: 'uefa.champions', name: 'UEFA Champions League', tag: 'CHAMPIONS LEAGUE', icon: '⭐' },
  { id: 'ita.1', name: 'Serie A', tag: 'SERIE A', icon: '🇮🇹' },
];

// Dot matrix SVG generator
const DotMatrixSvg = () => (
  <svg width="60" height="90" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {Array.from({ length: 6 }).map((_, r) =>
      Array.from({ length: 4 }).map((_, c) => (
        <circle
          key={`${r}-${c}`}
          cx={c * 17 + 5}
          cy={r * 16 + 5}
          r="2.8"
          fill="white"
          fillOpacity="0.45"
        />
      ))
    )}
  </svg>
);

// Official Inkhel Vector SVG
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
      <g transform="matrix(1,0,0,1,8414.76,104.994)">
        <g id="Layer-2" transform="matrix(4.16667,0,0,4.16667,0.644454,0.00583)">
          <g transform="matrix(1,0,0,-1,0,-308.736)">
            <path
              d="M282.495,-370.873C275.726,-373.162 269.663,-376.985 264.721,-381.929C261.603,-385.049 258.931,-388.615 256.809,-392.524C253.275,-399.035 251.267,-406.494 251.267,-414.423C251.267,-425.477 255.173,-435.62 261.679,-443.549C262.64,-444.72 263.658,-445.843 264.728,-446.913C269.67,-451.854 275.73,-455.675 282.498,-457.964C287.121,-459.526 292.072,-460.373 297.22,-460.373C309.911,-460.373 321.399,-455.229 329.715,-446.913C330.785,-445.844 331.803,-444.72 332.763,-443.55C339.27,-435.621 343.174,-425.477 343.174,-414.423C343.174,-406.494 341.167,-399.035 337.634,-392.524C335.512,-388.615 332.841,-385.049 329.722,-381.929C321.406,-373.609 309.916,-368.463 297.22,-368.463C292.071,-368.463 287.118,-369.31 282.495,-370.873Z"
              style={{ fill: 'rgb(20,168,220)', fillRule: 'nonzero' }}
            />
          </g>
          <g transform="matrix(1,0,0,-1,0,53.209)">
            <path
              d="M256.19,-149.303C238.448,-156.698 220.705,-164.092 202.963,-171.489C207.337,-172.686 211.713,-173.885 216.088,-175.084C228.952,-178.608 241.816,-182.132 254.678,-185.655C254.417,-214.27 254.155,-242.886 253.893,-271.5C253.86,-275.042 253.827,-278.582 253.795,-282.123C258.652,-293.162 263.51,-304.202 268.368,-315.241C275.622,-331.723 282.875,-348.207 290.129,-364.69C292.32,-357.418 294.511,-350.143 296.702,-342.869C298.412,-337.192 300.122,-331.514 301.832,-325.837C322.096,-258.564 342.358,-191.293 362.622,-124.022C364.812,-116.749 367.003,-109.475 369.193,-102.201C331.526,-117.902 293.858,-133.602 256.19,-149.303Z"
              style={{ fill: 'rgb(0,168,219)', fillRule: 'nonzero' }}
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
);

export const FixturesMakerPanel: React.FC<FixturesMakerPanelProps> = ({ onSwitchMode }) => {
  // Navigation mode switcher
  const [currentMode, setCurrentMode] = useState<'fixtures' | 'stats'>('fixtures');

  // League selection
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('eng.1');
  const [customLeagueTitle, setCustomLeagueTitle] = useState<string>('PREMIER LEAGUE');

  // Dates selection (Array of YYYYMMDD strings)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }, []);

  const [selectedDates, setSelectedDates] = useState<string[]>([todayStr, tomorrowStr]);
  const [customDateInput, setCustomDateInput] = useState<string>('');

  // Fixtures list state
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullError, setPullError] = useState<string | null>(null);

  // Appearance & Branding
  const [brandLogo, setBrandLogo] = useState<'fb' | 'wa'>('fb');
  const [bgImage, setBgImage] = useState<string>('');
  const [cardAspect, setCardAspect] = useState<'auto' | '4:5' | '9:16'>('auto');

  // Download & export
  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Convert external image URLs to use safe proxy
  const getSafeImageSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Resize observer to keep 819px preview scaled to fit container nicely
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        setPreviewScale(Math.min(1, containerWidth / 819));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Format YYYYMMDD to human readable (e.g. 20261024 -> Oct 24)
  const formatIsoDateLabel = (dateStr: string) => {
    try {
      if (dateStr.length === 8) {
        const y = dateStr.slice(0, 4);
        const m = dateStr.slice(4, 6);
        const d = dateStr.slice(6, 8);
        const dateObj = new Date(`${y}-${m}-${d}`);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Pull fixtures from ESPN API
  const handlePullFixtures = async () => {
    if (selectedDates.length === 0) {
      setPullError('Khawngaihin date pakhat tal thlang rawh le.');
      return;
    }

    setIsPulling(true);
    setPullError(null);

    try {
      const allEvents: any[] = [];

      for (const d of selectedDates) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${selectedLeagueId}/scoreboard?dates=${d}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          if (Array.isArray(json.events)) {
            allEvents.push(...json.events);
          }
        }
      }

      // Deduplicate by event id
      const uniqueMap = new Map<string, any>();
      for (const ev of allEvents) {
        if (!uniqueMap.has(ev.id)) {
          uniqueMap.set(ev.id, ev);
        }
      }

      if (uniqueMap.size === 0) {
        setPullError('He ni (dates) leh league-ah hian match schedule hmuh tur a awm rih lo.');
        setIsPulling(false);
        return;
      }

      // Parse matches into IST (Indian Standard Time)
      const parsedMatches: FixtureMatch[] = [];
      for (const ev of uniqueMap.values()) {
        const comp = ev.competitions?.[0];
        const competitors = comp?.competitors || [];
        const home = competitors.find((c: any) => c.homeAway === 'home');
        const away = competitors.find((c: any) => c.homeAway === 'away');

        const dUtc = new Date(ev.date);

        // 12-hour IST time (e.g. 7:30 PM)
        const istTime = dUtc.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        // Date ribbon header in IST (e.g. SATURDAY, 24 OCTOBER)
        const istDateFormatted = dUtc
          .toLocaleDateString('en-US', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
          .toUpperCase();

        const istDateSortKey = dUtc.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        parsedMatches.push({
          id: ev.id,
          utcDate: ev.date,
          istDateFormatted,
          istDateSortKey,
          istTime,
          homeTeam: home?.team?.displayName || 'Home Team',
          homeLogo: home?.team?.logo || home?.team?.logos?.[0]?.href || '',
          awayTeam: away?.team?.displayName || 'Away Team',
          awayLogo: away?.team?.logo || away?.team?.logos?.[0]?.href || '',
          selected: true,
        });
      }

      // Chronological sort
      parsedMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

      setFixtures(parsedMatches);

      // Auto update title based on league
      const matchedLeague = SUPPORTED_LEAGUES.find((l) => l.id === selectedLeagueId);
      if (matchedLeague) {
        setCustomLeagueTitle(matchedLeague.tag);
      }

      showNotice(`Match ${parsedMatches.length} lakkhawm fel a ni e!`);
    } catch (err: any) {
      setPullError(err.message || 'Error pulling fixtures from ESPN');
    } finally {
      setIsPulling(false);
    }
  };

  // Group selected fixtures by IST Date
  const groupedFixtures = useMemo(() => {
    const active = fixtures.filter((f) => f.selected);
    const groups: { dateLabel: string; matches: FixtureMatch[] }[] = [];

    active.forEach((match) => {
      let group = groups.find((g) => g.dateLabel === match.istDateFormatted);
      if (!group) {
        group = { dateLabel: match.istDateFormatted, matches: [] };
        groups.push(group);
      }
      group.matches.push(match);
    });

    return groups;
  }, [fixtures]);

  // Toggle single fixture selection
  const handleToggleFixture = (id: string) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  // Select / Deselect all
  const handleSelectAll = (select: boolean) => {
    setFixtures((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  // Update match details
  const handleUpdateMatch = (id: string, field: keyof FixtureMatch, value: any) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  // Remove match from list
  const handleDeleteMatch = (id: string) => {
    setFixtures((prev) => prev.filter((f) => f.id !== id));
  };

  // Add custom manual match
  const handleAddManualMatch = () => {
    const newId = `custom_${Date.now()}`;
    const d = new Date();
    const istTime = d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const istDateFormatted = d
      .toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      .toUpperCase();

    const newMatch: FixtureMatch = {
      id: newId,
      utcDate: new Date().toISOString(),
      istDateFormatted,
      istDateSortKey: d.toISOString().split('T')[0],
      istTime,
      homeTeam: 'Home Club',
      homeLogo: '',
      awayTeam: 'Away Club',
      awayLogo: '',
      selected: true,
    };
    setFixtures((prev) => [...prev, newMatch]);
  };

  // Quick Date button toggle
  const handleToggleDateStr = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  // Add custom date from date input
  const handleAddCustomDate = () => {
    if (!customDateInput) return;
    const cleanStr = customDateInput.replace(/-/g, '');
    if (!selectedDates.includes(cleanStr)) {
      setSelectedDates((prev) => [...prev, cleanStr].sort());
    }
    setCustomDateInput('');
  };

  // 1-Click HD Download
  const handleDownloadHd = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const fileName = `${customLeagueTitle.trim().replace(/\s+/g, '_')}_Fixtures_${brandLogo === 'fb' ? 'Xtra' : 'Inkhel'}.png`.replace(
        /[^a-zA-Z0-9-_\.]/g,
        '_'
      );

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      showNotice('HD Fixtures Card download fel a ni e!');
    } catch (err: any) {
      console.error('Download error:', err);
      showNotice('Download theih loh: ' + (err.message || 'Canvas error'));
    } finally {
      setIsDownloading(false);
    }
  };

  // Total active matches count
  const activeMatchesCount = fixtures.filter((f) => f.selected).length;

  // Initial auto pull on mount if fixtures is empty
  useEffect(() => {
    if (fixtures.length === 0) {
      handlePullFixtures();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Bar: Graphic Mode Switcher (Stats Card vs Fixtures) */}
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
            <p className="text-xs text-stone-500">Thlan tur: Match Stats Card emaw Upcoming Fixtures Graphic</p>
          </div>
        </div>

        {/* Dropdown / Segmented Toggle */}
        <div className="flex items-center gap-2">
          {/* Dropdown Menu */}
          <div className="relative">
            <select
              value="fixtures"
              onChange={(e) => {
                const val = e.target.value as 'stats' | 'fixtures';
                if (onSwitchMode) onSwitchMode(val);
              }}
              className="bg-[#EFECE6] border border-stone-300 font-bold text-xs py-1.5 pl-3 pr-8 rounded-xl text-stone-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="stats">📊 Stats Card</option>
              <option value="fixtures">📅 Fixtures</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#EFECE6] p-1 rounded-xl border border-stone-300/80">
            <button
              type="button"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('stats');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 text-stone-600 hover:text-stone-900"
            >
              <Sliders className="w-3.5 h-3.5 text-stone-500" />
              <span>Stats Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSwitchMode) onSwitchMode('fixtures');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 bg-amber-500 text-stone-950 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-950" />
              <span>Fixtures</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Area: Left Editor Column, Right Live Preview Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fixture Puller & Match Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. League & Date Selection Box */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>1. Select League & Match Dates</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                IST (12 Hours)
              </span>
            </div>

            {/* League Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                League Thlang Rawh
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LEAGUES.map((lg) => {
                  const isSelected = selectedLeagueId === lg.id;
                  return (
                    <button
                      key={lg.id}
                      onClick={() => {
                        setSelectedLeagueId(lg.id);
                        setCustomLeagueTitle(lg.tag);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-stone-950 ring-1 ring-amber-500'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-base">{lg.icon}</span>
                      <span className="truncate">{lg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Quick Pickers */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Date Thlang Rawh (Multiple Dates Theih)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleDateStr(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    selectedDates.includes(todayStr)
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  Vawiin ({formatIsoDateLabel(todayStr)})
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDateStr(tomorrowStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    selectedDates.includes(tomorrowStr)
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  Naktuk ({formatIsoDateLabel(tomorrowStr)})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDates([todayStr, tomorrowStr])}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Ni Hnih (Vawiin + Naktuk)
                </button>
              </div>

              {/* Selected Dates Badges & Custom Picker */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {selectedDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg"
                    >
                      <span>{formatIsoDateLabel(d)}</span>
                      <button
                        onClick={() => handleToggleDateStr(d)}
                        className="hover:text-red-700 font-extrabold"
                        title="Remove date"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customDateInput}
                    onChange={(e) => setCustomDateInput(e.target.value)}
                    className="border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                  />
                  <button
                    onClick={handleAddCustomDate}
                    disabled={!customDateInput}
                    className="px-2.5 py-1 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-stone-900 disabled:opacity-40"
                  >
                    + Add Date
                  </button>
                </div>
              </div>
            </div>

            {/* Pull / Collect Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePullFixtures}
                disabled={isPulling}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                <span>
                  {isPulling ? 'ESPN Aṭangin Match Lakkhawm Mek A Ni...' : 'Collect / Pull Fixtures (ESPN)'}
                </span>
              </button>
              {pullError && (
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pullError}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Matches Customizer & Selection */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>2. Match List ({activeMatchesCount} Selected)</span>
                </h3>
                <p className="text-[11px] text-stone-500">I duh duh thlang la, graphic-ah an rawn lang ang</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-800 bg-stone-100 px-2 py-1 rounded border border-stone-200"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={handleAddManualMatch}
                  className="text-xs font-bold text-stone-800 bg-stone-200 hover:bg-stone-300 px-2.5 py-1 rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Match</span>
                </button>
              </div>
            </div>

            {/* Fixture Items List */}
            {fixtures.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-medium">Match a la awm lo. A chung a "Collect / Pull" kha hmet rawh le.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {fixtures.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                      m.selected
                        ? 'border-stone-300 bg-stone-50/80 shadow-2xs'
                        : 'border-stone-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={m.selected}
                          onChange={() => handleToggleFixture(m.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                          {m.istDateFormatted.split(',')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={m.istTime}
                          onChange={(e) => handleUpdateMatch(m.id, 'istTime', e.target.value)}
                          className="w-24 text-center font-black text-xs bg-white border border-stone-300 rounded px-1.5 py-0.5 text-stone-900"
                          title="Match time in IST"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(m.id)}
                          className="text-stone-400 hover:text-red-600 p-1 rounded"
                          title="Delete match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-stone-200">
                        {m.homeLogo ? (
                          <img
                            src={getSafeImageSrc(m.homeLogo)}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center text-xs">⚽</span>
                        )}
                        <input
                          type="text"
                          value={m.homeTeam}
                          onChange={(e) => handleUpdateMatch(m.id, 'homeTeam', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-transparent focus:outline-none truncate"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-stone-200">
                        {m.awayLogo ? (
                          <img
                            src={getSafeImageSrc(m.awayLogo)}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center text-xs">⚽</span>
                        )}
                        <input
                          type="text"
                          value={m.awayTeam}
                          onChange={(e) => handleUpdateMatch(m.id, 'awayTeam', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-transparent focus:outline-none truncate"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Appearance, Title & Branding */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>3. Branding & Card Title</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Header Title (League Hming)
                </label>
                <input
                  type="text"
                  value={customLeagueTitle}
                  onChange={(e) => setCustomLeagueTitle(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Channel Branding Logo
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBrandLogo('fb')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      brandLogo === 'fb'
                        ? 'border-amber-500 bg-amber-500/10 text-stone-950 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Inkhel Xtra (Facebook)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandLogo('wa')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      brandLogo === 'wa'
                        ? 'border-amber-500 bg-amber-500/10 text-stone-950 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Inkhel (WhatsApp)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                Card Height / Aspect Ratio
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCardAspect('auto')}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold ${
                    cardAspect === 'auto'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  Auto Height (Fit)
                </button>
                <button
                  type="button"
                  onClick={() => setCardAspect('4:5')}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold ${
                    cardAspect === '4:5'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  Portrait 4:5 (1024px)
                </button>
                <button
                  type="button"
                  onClick={() => setCardAspect('9:16')}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold ${
                    cardAspect === '9:16'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  Story 9:16 (1458px)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Graphic Preview & Download (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Fixtures Preview</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                819px HD Card
              </span>
            </div>

            {/* Responsive Scale Container */}
            <div
              ref={previewContainerRef}
              className="w-full overflow-hidden rounded-xl bg-stone-950 shadow-inner flex justify-center items-start border border-stone-800"
              style={{
                minHeight: '480px',
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  width: '819px',
                }}
              >
                {/* Real 819px Canvas Element rendered for html-to-image */}
                <div
                  ref={cardRef}
                  style={{
                    width: '819px',
                    minHeight: cardAspect === '4:5' ? '1024px' : cardAspect === '9:16' ? '1458px' : '920px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '46px 28px 40px 28px',
                    color: '#ffffff',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    background:
                      'radial-gradient(circle at 50% 12%, rgba(26, 38, 64, 0.45) 0%, rgba(5, 7, 12, 0.96) 80%), linear-gradient(180deg, #121927 0%, #06080e 100%)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle Vignette Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 30%, transparent 35%, rgba(0,0,0,0.75) 100%)',
                    }}
                  />

                  {/* Corner Dot Matrix Accents */}
                  <div className="absolute top-[35px] right-[28px] z-4">
                    <DotMatrixSvg />
                  </div>
                  <div className="absolute bottom-[45px] left-[28px] z-4">
                    <DotMatrixSvg />
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 flex flex-col items-center w-full">
                    {/* Top League Title */}
                    <div
                      className="text-[20px] font-black uppercase text-amber-400 tracking-[3px] mb-1.5"
                      style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}
                    >
                      {customLeagueTitle || 'MATCHWEEK FIXTURES'}
                    </div>

                    {/* Subtitle / Big Header */}
                    <div
                      className="text-[36px] font-black uppercase tracking-[1px] text-white leading-none mb-3"
                      style={{
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        textShadow: '0 3px 10px rgba(0, 0, 0, 0.9)',
                      }}
                    >
                      UPCOMING FIXTURES
                    </div>

                    {/* Timezone Indicator Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-stone-200 mb-6 shadow-xs">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>All Kick-off Times in IST</span>
                    </div>

                    {/* Grouped Match Fixtures List */}
                    {groupedFixtures.length === 0 ? (
                      <div className="py-20 text-center text-stone-400 space-y-2">
                        <p className="text-sm font-bold">Match thlan a la awm lo</p>
                      </div>
                    ) : (
                      <div className="w-[720px] space-y-5">
                        {groupedFixtures.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-2.5">
                            {/* Date Header Banner */}
                            <div
                              className="w-full py-1.5 px-4 rounded-lg flex items-center justify-center font-black text-[13.5px] uppercase tracking-[1.5px] text-amber-300"
                              style={{
                                background: 'linear-gradient(90deg, rgba(138, 10, 10, 0) 0%, rgba(138, 10, 10, 0.85) 25%, rgba(138, 10, 10, 0.85) 75%, rgba(138, 10, 10, 0) 100%)',
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
                              }}
                            >
                              {group.dateLabel}
                            </div>

                            {/* Match Rows */}
                            <div className="space-y-2">
                              {group.matches.map((m) => (
                                <div
                                  key={m.id}
                                  className="w-full h-[62px] bg-white rounded-xl px-5 flex items-center justify-between"
                                  style={{
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                                  }}
                                >
                                  {/* Home Team */}
                                  <div className="flex items-center justify-end gap-3 flex-1 min-w-0 pr-3">
                                    <span className="font-extrabold text-[16.5px] text-stone-900 truncate uppercase tracking-tight text-right">
                                      {m.homeTeam}
                                    </span>
                                    <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                                      {m.homeLogo ? (
                                        <img
                                          src={getSafeImageSrc(m.homeLogo)}
                                          alt=""
                                          className="max-w-[36px] max-h-[36px] object-contain"
                                          crossOrigin="anonymous"
                                          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}
                                        />
                                      ) : (
                                        <span className="text-xl">⚽</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Center Time Pill */}
                                  <div
                                    className="bg-stone-900 text-white rounded-lg px-3.5 py-1.5 text-center shrink-0 flex items-center justify-center border border-stone-800"
                                    style={{
                                      minWidth: '100px',
                                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15)',
                                    }}
                                  >
                                    <span className="text-[14.5px] font-black text-amber-400 tracking-wide">
                                      {m.istTime}
                                    </span>
                                  </div>

                                  {/* Away Team */}
                                  <div className="flex items-center justify-start gap-3 flex-1 min-w-0 pl-3">
                                    <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                                      {m.awayLogo ? (
                                        <img
                                          src={getSafeImageSrc(m.awayLogo)}
                                          alt=""
                                          className="max-w-[36px] max-h-[36px] object-contain"
                                          crossOrigin="anonymous"
                                          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}
                                        />
                                      ) : (
                                        <span className="text-xl">⚽</span>
                                      )}
                                    </div>
                                    <span className="font-extrabold text-[16.5px] text-stone-900 truncate uppercase tracking-tight text-left">
                                      {m.awayTeam}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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
            </div>

            {/* Direct 1-Click Download Button */}
            <div className="mt-4 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleDownloadHd}
                disabled={isDownloading || activeMatchesCount === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>
                  {isDownloading ? 'Graphic Siam Mek A Ni...' : 'Download HD Fixtures Card (PNG)'}
                </span>
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
