import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Sparkles,
  Trophy,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface GraphicMakerPanelProps {
  onPostCreated?: (silent?: boolean) => Promise<void>;
}

export interface ScorecardProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: {
    league: string;
    status: 'FULL TIME' | 'HALF TIME';
    homeTeam: string;
    homeScore: string;
    homeLogo: string;
    homeScorers: string;
    homeRedCardScorers: string;
    awayTeam: string;
    awayScore: string;
    awayLogo: string;
    awayScorers: string;
    awayRedCardScorers: string;
    includeStats: boolean;
    homePossession: string;
    awayPossession: string;
    homeShots: string;
    awayShots: string;
    homeShotsOnTarget: string;
    awayShotsOnTarget: string;
    homeCorners: string;
    awayCorners: string;
    homeFouls: string;
    awayFouls: string;
    homeYellowCards: string;
    awayYellowCards: string;
    homeRedCards: string;
    awayRedCards: string;
    bgImage: string;
    brandLogo: 'fb' | 'wa';
  };
}

const TOURNAMENT_PRESETS = [
  'MIZORAM PREMIER LEAGUE',
  'I-LEAGUE',
  'DURAND CUP',
  'SANTOSH TROPHY',
  'CHAMPIONS LEAGUE',
  'PREMIER LEAGUE',
  'ISL',
  'CLUB FRIENDLY',
];

const MPL_TEAMS = [
  {
    name: 'Aizawl FC',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/43/Aizawl_Football_Club.svg',
  },
  {
    name: 'Chanmari FC',
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Chanmari_FC.svg',
  },
  {
    name: 'FC Chhinga Veng',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/17/Chhinga_Veng_FC.svg',
  },
  {
    name: 'Ramthar Veng FC',
    logo: '',
  },
  {
    name: 'Mizoram Police FC',
    logo: '',
  },
  {
    name: 'SYS FC',
    logo: '',
  },
  {
    name: 'Sihphir Venghlun FC',
    logo: '',
  },
  {
    name: 'FC Venghnuai',
    logo: '',
  },
  {
    name: 'Bethlehem VT FC',
    logo: '',
  },
  {
    name: 'Real Madrid',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  },
  {
    name: 'Arsenal',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  },
  {
    name: 'Bayern Munich',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  },
  {
    name: 'Manchester United',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  },
  {
    name: 'Liverpool',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  },
  {
    name: 'Chelsea',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  },
  {
    name: 'Barcelona',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  },
  {
    name: 'Mohun Bagan SG',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/10006.png',
  },
  {
    name: 'East Bengal FC',
    logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9895.png',
  },
];

// Dot Matrix SVG pattern
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
          fillOpacity="0.65"
        />
      ))
    )}
  </svg>
);

// Soccer Ball Icon for Scorers
const SoccerBallIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
  >
    <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
    <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#111827" />
    <line x1="12" y1="7.5" x2="12" y2="2" stroke="#111827" strokeWidth="1.2" />
    <line x1="15.5" y1="10" x2="20.5" y2="7.5" stroke="#111827" strokeWidth="1.2" />
    <line x1="14.2" y1="14" x2="18" y2="19.5" stroke="#111827" strokeWidth="1.2" />
    <line x1="9.8" y1="14" x2="6" y2="19.5" stroke="#111827" strokeWidth="1.2" />
    <line x1="8.5" y1="10" x2="3.5" y2="7.5" stroke="#111827" strokeWidth="1.2" />
  </svg>
);

// Red Card Icon
const RedCardIcon = () => (
  <div
    style={{
      width: '12px',
      height: '16px',
      backgroundColor: '#DC2626',
      borderRadius: '2px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.2)',
      transform: 'rotate(8deg)',
    }}
  />
);

// Official Inkhel Vector SVG
const InkhelSvgLogo = () => (
  <svg
    width="170"
    height="46"
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

export const GraphicMakerPanel: React.FC<GraphicMakerPanelProps> = () => {
  const [league, setLeague] = useState('MIZORAM PREMIER LEAGUE');
  const [status, setStatus] = useState<'FULL TIME' | 'HALF TIME'>('FULL TIME');

  // Home Team
  const [homeTeam, setHomeTeam] = useState('Chanmari FC');
  const [homeScore, setHomeScore] = useState('2');
  const [homeLogo, setHomeLogo] = useState('https://upload.wikimedia.org/wikipedia/en/5/59/Chanmari_FC.svg');
  const [homeScorers, setHomeScorers] = useState("Lalthanmawia 23', 67'");
  const [homeRedCardScorers, setHomeRedCardScorers] = useState('');

  // Away Team
  const [awayTeam, setAwayTeam] = useState('Ramthar Veng FC');
  const [awayScore, setAwayScore] = useState('1');
  const [awayLogo, setAwayLogo] = useState('');
  const [awayScorers, setAwayScorers] = useState("David 89'");
  const [awayRedCardScorers, setAwayRedCardScorers] = useState('');

  // Stats
  const [includeStats, setIncludeStats] = useState(true);
  const [homePossession, setHomePossession] = useState('54%');
  const [awayPossession, setAwayPossession] = useState('46%');
  const [homeShots, setHomeShots] = useState('14');
  const [awayShots, setAwayShots] = useState('9');
  const [homeShotsOnTarget, setHomeShotsOnTarget] = useState('7');
  const [awayShotsOnTarget, setAwayShotsOnTarget] = useState('4');
  const [homeCorners, setHomeCorners] = useState('6');
  const [awayCorners, setAwayCorners] = useState('3');
  const [homeFouls, setHomeFouls] = useState('11');
  const [awayFouls, setAwayFouls] = useState('12');
  const [homeYellowCards, setHomeYellowCards] = useState('1');
  const [awayYellowCards, setAwayYellowCards] = useState('2');
  const [homeRedCards, setHomeRedCards] = useState('0');
  const [awayRedCards, setAwayRedCards] = useState('0');

  // Background Image
  const [bgImage, setBgImage] = useState('');

  // Branding: 'fb' = Inkhel Xtra, 'wa' = Inkhel
  const [brandLogo, setBrandLogo] = useState<'fb' | 'wa'>('fb');

  // Generation & Download States
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.44);

  // Saved Projects State
  const [projects, setProjects] = useState<ScorecardProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const awayFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('xtra_scorecard_projects');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading projects:', e);
    }
  }, []);

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => {
      setSuccessNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleOpenSaveModal = () => {
    const active = projects.find((p) => p.id === activeProjectId);
    const defaultName = active
      ? active.name
      : `${homeTeam.trim() || 'Home Team'} vs ${awayTeam.trim() || 'Away Team'}`;
    setSaveNameInput(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    const finalName =
      saveNameInput.trim() || `${homeTeam.trim() || 'Home Team'} vs ${awayTeam.trim() || 'Away Team'}`;
    const projectData = {
      league,
      status,
      homeTeam,
      homeScore,
      homeLogo,
      homeScorers,
      homeRedCardScorers,
      awayTeam,
      awayScore,
      awayLogo,
      awayScorers,
      awayRedCardScorers,
      includeStats,
      homePossession,
      awayPossession,
      homeShots,
      awayShots,
      homeShotsOnTarget,
      awayShotsOnTarget,
      homeCorners,
      awayCorners,
      homeFouls,
      awayFouls,
      homeYellowCards,
      awayYellowCards,
      homeRedCards,
      awayRedCards,
      bgImage,
      brandLogo,
    };

    let updatedProjects: ScorecardProject[];
    let targetId = activeProjectId;

    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      // Update existing project
      updatedProjects = projects.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              name: finalName,
              updatedAt: new Date().toISOString(),
              data: projectData,
            }
          : p
      );
    } else {
      // Create new project
      targetId = 'proj_' + Date.now();
      const newProj: ScorecardProject = {
        id: targetId,
        name: finalName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: projectData,
      };
      updatedProjects = [newProj, ...projects];
    }

    setProjects(updatedProjects);
    setActiveProjectId(targetId);
    try {
      localStorage.setItem('xtra_scorecard_projects', JSON.stringify(updatedProjects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
    }

    setIsSaveModalOpen(false);
    showNotice(`Project "${finalName}" save fel a ni ta!`);
  };

  const handleLoadProject = (proj: ScorecardProject) => {
    setLeague(proj.data.league);
    setStatus(proj.data.status);
    setHomeTeam(proj.data.homeTeam);
    setHomeScore(proj.data.homeScore);
    setHomeLogo(proj.data.homeLogo || '');
    setHomeScorers(proj.data.homeScorers || '');
    setHomeRedCardScorers(proj.data.homeRedCardScorers || '');
    setAwayTeam(proj.data.awayTeam);
    setAwayScore(proj.data.awayScore);
    setAwayLogo(proj.data.awayLogo || '');
    setAwayScorers(proj.data.awayScorers || '');
    setAwayRedCardScorers(proj.data.awayRedCardScorers || '');
    setIncludeStats(proj.data.includeStats ?? true);
    setHomePossession(proj.data.homePossession || '50%');
    setAwayPossession(proj.data.awayPossession || '50%');
    setHomeShots(proj.data.homeShots || '0');
    setAwayShots(proj.data.awayShots || '0');
    setHomeShotsOnTarget(proj.data.homeShotsOnTarget || '0');
    setAwayShotsOnTarget(proj.data.awayShotsOnTarget || '0');
    setHomeCorners(proj.data.homeCorners || '0');
    setAwayCorners(proj.data.awayCorners || '0');
    setHomeFouls(proj.data.homeFouls || '0');
    setAwayFouls(proj.data.awayFouls || '0');
    setHomeYellowCards(proj.data.homeYellowCards || '0');
    setAwayYellowCards(proj.data.awayYellowCards || '0');
    setHomeRedCards(proj.data.homeRedCards || '0');
    setAwayRedCards(proj.data.awayRedCards || '0');
    setBgImage(proj.data.bgImage || '');
    setBrandLogo(proj.data.brandLogo || 'fb');

    setActiveProjectId(proj.id);
    setIsProjectsModalOpen(false);
    showNotice(`Project "${proj.name}" load a ni ta!`);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
    try {
      localStorage.setItem('xtra_scorecard_projects', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showNotice('Project paih a ni ta.');
  };

  const handleNewProject = () => {
    setActiveProjectId(null);
    setLeague('MIZORAM PREMIER LEAGUE');
    setStatus('FULL TIME');
    setHomeTeam('Chanmari FC');
    setHomeScore('0');
    setHomeLogo('https://upload.wikimedia.org/wikipedia/en/5/59/Chanmari_FC.svg');
    setHomeScorers('');
    setHomeRedCardScorers('');
    setAwayTeam('Ramthar Veng FC');
    setAwayScore('0');
    setAwayLogo('');
    setAwayScorers('');
    setAwayRedCardScorers('');
    setIncludeStats(true);
    setHomePossession('50%');
    setAwayPossession('50%');
    setHomeShots('0');
    setAwayShots('0');
    setHomeShotsOnTarget('0');
    setAwayShotsOnTarget('0');
    setHomeCorners('0');
    setAwayCorners('0');
    setHomeFouls('0');
    setAwayFouls('0');
    setHomeYellowCards('0');
    setAwayYellowCards('0');
    setHomeRedCards('0');
    setAwayRedCards('0');
    setBgImage('');
    setBrandLogo('fb');
    showNotice('Project thar siam a ni ta.');
  };

  // Resize observer to keep preview scaled nicely to right column width
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        setPreviewScale(containerWidth / 819);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Handle local file uploads
  const handleUploadFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  // Parse scorers helper: keep multiple goals/minutes by one player on a single line, and separate players on new lines
  const parseScorers = (raw: string): string[] => {
    if (!raw || !raw.trim()) return [];
    const lines = raw.includes('\n') ? raw.split('\n') : raw.includes(';') ? raw.split(';') : [raw];
    const results: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const segments = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      let currentPlayer = '';

      for (const seg of segments) {
        const hasLetters = /[a-zA-Z]{2,}/.test(seg);
        if (!hasLetters && currentPlayer) {
          currentPlayer += `, ${seg}`;
        } else {
          if (currentPlayer) results.push(currentPlayer);
          currentPlayer = seg;
        }
      }
      if (currentPlayer) results.push(currentPlayer);
    }
    return results;
  };

  // Auto-sync possession percentage so both always total 100%
  const handleHomePossessionChange = (val: string) => {
    setHomePossession(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean !== '') {
      const num = Math.min(100, Math.max(0, parseInt(clean, 10)));
      setAwayPossession(`${100 - num}%`);
    }
  };

  const handleAwayPossessionChange = (val: string) => {
    setAwayPossession(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean !== '') {
      const num = Math.min(100, Math.max(0, parseInt(clean, 10)));
      setHomePossession(`${100 - num}%`);
    }
  };

  const handleHomePossessionBlur = () => {
    const clean = homePossession.replace(/[^0-9]/g, '');
    if (clean !== '') {
      const num = Math.min(100, Math.max(0, parseInt(clean, 10)));
      setHomePossession(`${num}%`);
      setAwayPossession(`${100 - num}%`);
    }
  };

  const handleAwayPossessionBlur = () => {
    const clean = awayPossession.replace(/[^0-9]/g, '');
    if (clean !== '') {
      const num = Math.min(100, Math.max(0, parseInt(clean, 10)));
      setAwayPossession(`${num}%`);
      setHomePossession(`${100 - num}%`);
    }
  };

  // Convert external image URLs to use safe proxy if necessary
  const getSafeImageSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Direct 1-Click HD Download Handler: What you see in Live Preview is downloaded directly as unscaled 819x1024 PNG
  const handleDirectDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setErrorMsg(null);

    const fileName = `${homeTeam.trim()}-vs-${awayTeam.trim()}-${status.replace(/\s+/g, '')}-${brandLogo === 'fb' ? 'Xtra' : 'Inkhel'}.png`.replace(
      /[^a-zA-Z0-9-_\.]/g,
      '_'
    );

    try {
      // Snapshot cardRef unscaled at exact 819x1024 with no scale distortion
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 819,
        height: 1024,
        quality: 1,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
          top: '0',
          left: '0',
        },
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download snapshot failed:', err);
      try {
        const fallbackUrl = await toPng(cardRef.current, {
          pixelRatio: 1,
          width: 819,
          height: 1024,
          style: {
            transform: 'none',
            transformOrigin: 'top left',
          },
        });
        const a = document.createElement('a');
        a.href = fallbackUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (fallbackErr: any) {
        setErrorMsg('Image download a buai deuh: ' + (fallbackErr?.message || 'Error occurred'));
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Stats calculation
  const statsList = [
    { label: 'POSSESSION', home: homePossession, away: awayPossession, isPossession: true },
    { label: 'SHOTS', home: homeShots, away: awayShots },
    { label: 'SHOTS ON TARGET', home: homeShotsOnTarget, away: awayShotsOnTarget },
    { label: 'CORNERS', home: homeCorners, away: awayCorners },
    { label: 'FOULS', home: homeFouls, away: awayFouls },
    { label: 'YELLOW CARDS', home: homeYellowCards, away: awayYellowCards },
    { label: 'RED CARDS', home: homeRedCards, away: awayRedCards },
  ];

  const homeScorersList = parseScorers(homeScorers);
  const awayScorersList = parseScorers(awayScorers);
  const homeRedCardList = parseScorers(homeRedCardScorers);
  const awayRedCardList = parseScorers(awayRedCardScorers);

  const statusTop = status.includes('FULL') ? 'FULL' : 'HALF';
  const statusBottom = 'TIME';

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Graphic Scorecard Maker
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                HD 819x1024
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-medium">
            Match score leh stats te duang la, a hnuaia "Download HD Scorecard" hmetin 0.2s chhungin i khawl-ah direct-in download nghal rawh.
          </p>
        </div>

        {/* Branding Logo Picker (Inkhel Xtra vs Inkhel) */}
        <div className="flex flex-col gap-1 self-start sm:self-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Logo Thlang Rawh:
          </span>
          <div className="flex items-center bg-stone-800/90 p-1 rounded-2xl border border-stone-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBrandLogo('fb')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                brandLogo === 'fb'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>Inkhel Xtra</span>
              {brandLogo === 'fb' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setBrandLogo('wa')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                brandLogo === 'wa'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>Inkhel (Normal)</span>
              {brandLogo === 'wa' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Projects Management Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:px-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Project</span>
          </button>

          {/* Saved Projects Button */}
          <button
            type="button"
            onClick={() => setIsProjectsModalOpen(true)}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-200 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-stone-600" />
            <span>Saved Projects</span>
            {projects.length > 0 && (
              <span className="px-1.5 py-0.2 bg-stone-900 text-white text-[10px] rounded-full font-extrabold">
                {projects.length}
              </span>
            )}
          </button>

          {/* New / Reset Button */}
          <button
            type="button"
            onClick={handleNewProject}
            className="px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-semibold flex items-center gap-1 border border-stone-200 transition cursor-pointer"
            title="Siam thar / Reset"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {activeProjectId && (
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
              Active: {projects.find((p) => p.id === activeProjectId)?.name || 'Custom'}
            </span>
          )}
        </div>

        {/* Quick project chips */}
        {projects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 no-scrollbar">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
              Quick Load:
            </span>
            {projects.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleLoadProject(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 border cursor-pointer ${
                  activeProjectId === p.id
                    ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
                }`}
              >
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save Project Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <Save className="w-4 h-4 text-rose-600" />
                <span>Project Save Rawh</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Project Hming</label>
              <input
                type="text"
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmSave();
                }}
                placeholder="e.g. Chanmari FC vs Ramthar Veng FC"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-rose-600"
                autoFocus
              />
              <p className="text-[11px] text-stone-500">
                Match score, scorers, red card leh stats zawng zawng a in-save ang a, engtik lai pawhin i load leh thei ang.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Projects Modal */}
      {isProjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-600" />
                <span>Saved Scorecard Projects ({projects.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {projects.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs font-medium space-y-1">
                  <p>Project save a la awm rih lo.</p>
                  <p className="text-[11px] text-stone-400">Match score i siam zawhah "Save Project" hmetin save rawh.</p>
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      activeProjectId === proj.id
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-stone-50/80 hover:bg-stone-100/90 border-stone-200'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-stone-900 truncate">
                          {proj.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-md uppercase shrink-0">
                          {proj.data.status === 'FULL TIME' ? 'FT' : 'HT'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2">
                        <span>
                          {proj.data.homeTeam || 'Home'} ({proj.data.homeScore}) : ({proj.data.awayScore}) {proj.data.awayTeam || 'Away'}
                        </span>
                        <span>•</span>
                        <span className="text-stone-400 text-[10px]">
                          {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadProject(proj);
                        }}
                        className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[11px] font-bold hover:bg-stone-800 transition"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Paih"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleNewProject}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Project Thar Siam</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProjectsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Two Column Layout: Controls (Left) & Live Preview + Instant Download (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Tournament & Status */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Tournament & Status
            </h3>

            <div>
              <label className="text-[11px] font-bold text-stone-700 mb-1 block">
                Tournament / League Hming
              </label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="e.g. MIZORAM PREMIER LEAGUE"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {TOURNAMENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLeague(p)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition ${
                      league === p
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-stone-700">Status:</span>
              <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStatus('FULL TIME')}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === 'FULL TIME'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  FULL TIME
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('HALF TIME')}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === 'HALF TIME'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  HALF TIME
                </button>
              </div>
            </div>
          </div>

          {/* 2. Teams & Scores */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center justify-between">
              <span>Teams, Scores & Scorers</span>
              <span className="text-[10px] text-stone-400 font-normal">Club logo thlang la emaw upload rawh</span>
            </h3>

            {/* Quick MPL Club Presets */}
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Quick Select Club:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {MPL_TEAMS.map((team) => (
                  <button
                    key={team.name}
                    type="button"
                    onClick={() => {
                      if (!homeTeam || homeTeam === 'Chanmari FC') {
                        setHomeTeam(team.name);
                        if (team.logo) setHomeLogo(team.logo);
                      } else {
                        setAwayTeam(team.name);
                        if (team.logo) setAwayLogo(team.logo);
                      }
                    }}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 whitespace-nowrap shrink-0 transition"
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Team */}
              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-700 uppercase tracking-wide">
                    Home Team (Veilam)
                  </span>
                  {homeLogo ? (
                    <img src={homeLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Team Hming</label>
                  <input
                    type="text"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="e.g. Chanmari FC"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Score</label>
                    <input
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Logo</label>
                    <button
                      type="button"
                      onClick={() => homeFileInputRef.current?.click()}
                      className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg py-1.5 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-stone-600" />
                      <span>Upload</span>
                    </button>
                    <input
                      ref={homeFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, setHomeLogo)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-stone-500">Goal Scorers (Minute nen)</label>
                    <span className="text-[9px] text-stone-400">Scorer dang chu hnuai lamah</span>
                  </div>
                  <textarea
                    rows={2}
                    value={homeScorers}
                    onChange={(e) => setHomeScorers(e.target.value)}
                    placeholder={"e.g. Lalthanmawia 23', 67'\nDavid 89'"}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 resize-none font-medium leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                      <span className="w-2 h-2.5 bg-rose-600 rounded-[1px] inline-block" />
                      <span>Red Card (Optional)</span>
                    </label>
                    <span className="text-[9px] text-stone-400">Player & minute</span>
                  </div>
                  <input
                    type="text"
                    value={homeRedCardScorers}
                    onChange={(e) => {
                      setHomeRedCardScorers(e.target.value);
                      if (e.target.value.trim() && homeRedCards === '0') {
                        setHomeRedCards('1');
                      }
                    }}
                    placeholder="e.g. Lalbiakzuala 75'"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Away Team */}
              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wide">
                    Away Team (Dinglam)
                  </span>
                  {awayLogo ? (
                    <img src={awayLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Team Hming</label>
                  <input
                    type="text"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="e.g. Ramthar Veng FC"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Score</label>
                    <input
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Logo</label>
                    <button
                      type="button"
                      onClick={() => awayFileInputRef.current?.click()}
                      className="w-full bg-white hover:bg-stone-100 border border-stone-300 rounded-lg py-1.5 text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-stone-600" />
                      <span>Upload</span>
                    </button>
                    <input
                      ref={awayFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, setAwayLogo)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-stone-500">Goal Scorers (Minute nen)</label>
                    <span className="text-[9px] text-stone-400">Scorer dang chu hnuai lamah</span>
                  </div>
                  <textarea
                    rows={2}
                    value={awayScorers}
                    onChange={(e) => setAwayScorers(e.target.value)}
                    placeholder={"e.g. David 89'\nLalhmunmawia 90+3'"}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 resize-none font-medium leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                      <span className="w-2 h-2.5 bg-rose-600 rounded-[1px] inline-block" />
                      <span>Red Card (Optional)</span>
                    </label>
                    <span className="text-[9px] text-stone-400">Player & minute</span>
                  </div>
                  <input
                    type="text"
                    value={awayRedCardScorers}
                    onChange={(e) => {
                      setAwayRedCardScorers(e.target.value);
                      if (e.target.value.trim() && awayRedCards === '0') {
                        setAwayRedCards('1');
                      }
                    }}
                    placeholder="e.g. Rohmingthanga 82'"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Match Stats (7 Rows) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-500" />
                7 Match Stats (Optional)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Stats Telh</span>
              </label>
            </div>

            {includeStats && (
              <div className="space-y-2 pt-1 text-xs">
                {/* 1. Possession */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <div className="col-span-4 flex flex-col">
                    <span className="font-bold text-stone-800 text-[11px]">POSSESSION</span>
                    <span className="text-[9px] text-stone-400 font-normal">Auto 100% sync</span>
                  </div>
                  <input
                    type="text"
                    value={homePossession}
                    onChange={(e) => handleHomePossessionChange(e.target.value)}
                    onBlur={handleHomePossessionBlur}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs focus:outline-none focus:border-rose-600"
                    placeholder="50%"
                  />
                  <input
                    type="text"
                    value={awayPossession}
                    onChange={(e) => handleAwayPossessionChange(e.target.value)}
                    onBlur={handleAwayPossessionBlur}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs focus:outline-none focus:border-rose-600"
                    placeholder="50%"
                  />
                </div>

                {/* 2. Shots */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">SHOTS</span>
                  <input
                    type="text"
                    value={homeShots}
                    onChange={(e) => setHomeShots(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShots}
                    onChange={(e) => setAwayShots(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 3. Shots on target */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">SHOTS ON TARGET</span>
                  <input
                    type="text"
                    value={homeShotsOnTarget}
                    onChange={(e) => setHomeShotsOnTarget(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayShotsOnTarget}
                    onChange={(e) => setAwayShotsOnTarget(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 4. Corners */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">CORNERS</span>
                  <input
                    type="text"
                    value={homeCorners}
                    onChange={(e) => setHomeCorners(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayCorners}
                    onChange={(e) => setAwayCorners(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 5. Fouls */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">FOULS</span>
                  <input
                    type="text"
                    value={homeFouls}
                    onChange={(e) => setHomeFouls(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayFouls}
                    onChange={(e) => setAwayFouls(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 6. Yellow Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">YELLOW CARDS</span>
                  <input
                    type="text"
                    value={homeYellowCards}
                    onChange={(e) => setHomeYellowCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayYellowCards}
                    onChange={(e) => setAwayYellowCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>

                {/* 7. Red Cards */}
                <div className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                  <span className="col-span-4 font-bold text-stone-800 text-[11px]">RED CARDS</span>
                  <input
                    type="text"
                    value={homeRedCards}
                    onChange={(e) => setHomeRedCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                  <input
                    type="text"
                    value={awayRedCards}
                    onChange={(e) => setAwayRedCards(e.target.value)}
                    className="col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Match Action Photo Background (Optional) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-800 block">Match Photo (Background)</span>
                <span className="text-[11px] text-stone-500">Thlalak awm loh chuan default dark visual a hmang ang</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bgImage && (
                <button
                  type="button"
                  onClick={() => setBgImage('')}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Paih
                </button>
              )}
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-200 flex items-center gap-1 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadFile(e, setBgImage)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & Direct 1-Click HD Download */}
        <div className="lg:col-span-5 sticky top-20 space-y-3.5">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview (819x1024)
              </span>
              <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                {brandLogo === 'fb' ? 'Inkhel Xtra (Facebook)' : 'Inkhel (WhatsApp)'}
              </span>
            </div>

            {/* Container for Live Preview */}
            <div
              ref={previewContainerRef}
              className="w-full bg-[#090c13] rounded-2xl overflow-hidden border border-stone-300 shadow-md aspect-[819/1024] relative flex items-start justify-start select-none"
            >
              {/* Scaler Wrapper: applies CSS scale only to the preview display */}
              <div
                style={{
                  width: '819px',
                  height: '1024px',
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {/* Canonical Unscaled Card Element (Snapshot Target) */}
                <div
                  ref={cardRef}
                  style={{
                    width: '819px',
                    height: '1024px',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '58px',
                    color: '#ffffff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {/* Background Layer */}
                  <div
                    className="absolute inset-0 z-1"
                    style={{
                      background: bgImage
                        ? `linear-gradient(180deg, rgba(8, 12, 18, 0.85) 0%, rgba(4, 6, 10, 0.94) 100%), url('${getSafeImageSrc(
                            bgImage
                          )}') center / cover no-repeat`
                        : 'radial-gradient(circle at 50% 18%, rgba(20, 28, 48, 0.4) 0%, rgba(5, 7, 12, 0.95) 80%), linear-gradient(180deg, #121824 0%, #06080e 100%)',
                    }}
                  />

                  {/* Vignette Overlay */}
                  <div
                    className="absolute inset-0 z-2 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 30%, transparent 35%, rgba(0,0,0,0.8) 100%)',
                    }}
                  />

                  {/* Dot Accents */}
                  <div className="absolute top-[75px] right-[30px] z-4">
                    <DotMatrixSvg />
                  </div>
                  <div className="absolute bottom-[125px] left-[30px] z-4">
                    <DotMatrixSvg />
                  </div>

                  {/* Content Wrap */}
                  <div className="relative z-10 flex flex-col items-center w-full">
                    {/* League Title */}
                    <div
                      className="text-[21px] font-extrabold uppercase text-white mb-4"
                      style={{
                        letterSpacing: '2px',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                      }}
                    >
                      {league || 'MATCH RESULT'}
                    </div>

                    {/* Status Badge */}
                    <div
                      className="bg-white w-[126px] h-[98px] rounded-t-[4px] flex flex-col items-center justify-center -mb-[1px] z-12"
                      style={{
                        boxShadow: '0 -3px 12px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div
                        className="text-[38px] leading-[0.92] font-black text-[#7E0A0A] uppercase"
                        style={{
                          fontFamily: 'Impact, "Arial Black", -apple-system, sans-serif',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {statusTop}
                      </div>
                      <div
                        className="text-[38px] leading-[0.92] font-black text-[#7E0A0A] uppercase"
                        style={{
                          fontFamily: 'Impact, "Arial Black", -apple-system, sans-serif',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {statusBottom}
                      </div>
                    </div>

                    {/* Scoreboard Box (655x158) */}
                    <div
                      className="w-[655px] h-[158px] flex items-stretch"
                      style={{
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {/* Home Crest Box */}
                      <div className="bg-white w-[164px] flex items-center justify-center p-3">
                        {homeLogo ? (
                          <img
                            src={getSafeImageSrc(homeLogo)}
                            alt={homeTeam}
                            className="max-w-[100px] max-height-[100px] object-contain"
                            crossOrigin="anonymous"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                          />
                        ) : (
                          <span className="text-5xl">⚽</span>
                        )}
                      </div>

                      {/* Score Center */}
                      <div className="bg-[#8A0A0A] w-[327px] flex items-center justify-center">
                        <div
                          className="text-[114px] leading-none font-black text-white"
                          style={{
                            fontFamily: 'Impact, "Arial Black", -apple-system, sans-serif',
                            letterSpacing: '8px',
                            textShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                            transform: 'translateY(-2px)',
                          }}
                        >
                          {homeScore} : {awayScore}
                        </div>
                      </div>

                      {/* Away Crest Box */}
                      <div className="bg-white w-[164px] flex items-center justify-center p-3">
                        {awayLogo ? (
                          <img
                            src={getSafeImageSrc(awayLogo)}
                            alt={awayTeam}
                            className="max-w-[100px] max-height-[100px] object-contain"
                            crossOrigin="anonymous"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                          />
                        ) : (
                          <span className="text-5xl">⚽</span>
                        )}
                      </div>
                    </div>

                    {/* Events Section (Scorers & Red Cards) */}
                    <div className="w-[655px] flex flex-col items-center mt-3.5 mb-4 px-5 min-h-[52px]">
                      {/* Goal Scorers Row */}
                      {(homeScorersList.length > 0 || awayScorersList.length > 0) && (
                        <div className="w-full flex items-start justify-between">
                          {/* Home Scorers */}
                          <div
                            className="text-right text-[15.5px] font-bold text-white leading-[1.38] flex-1 pr-3"
                            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)' }}
                          >
                            {homeScorersList.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>

                          {/* Center Ball Icon */}
                          <div className="w-[36px] flex justify-center items-center pt-0.5 shrink-0">
                            <SoccerBallIcon />
                          </div>

                          {/* Away Scorers */}
                          <div
                            className="text-left text-[15.5px] font-bold text-white leading-[1.38] flex-1 pl-3"
                            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)' }}
                          >
                            {awayScorersList.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Red Cards Row (Only shown if at least one red card is entered) */}
                      {(homeRedCardList.length > 0 || awayRedCardList.length > 0) && (
                        <div className={`w-full flex items-start justify-between ${homeScorersList.length > 0 || awayScorersList.length > 0 ? 'mt-2' : ''}`}>
                          {/* Home Red Cards */}
                          <div
                            className="text-right text-[14px] font-bold text-rose-300 leading-[1.35] flex-1 pr-3"
                            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)' }}
                          >
                            {homeRedCardList.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>

                          {/* Center Red Card Icon */}
                          <div className="w-[36px] flex justify-center items-center pt-0.5 shrink-0">
                            <RedCardIcon />
                          </div>

                          {/* Away Red Cards */}
                          <div
                            className="text-left text-[14px] font-bold text-rose-300 leading-[1.35] flex-1 pl-3"
                            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)' }}
                          >
                            {awayRedCardList.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 7 Stats Cards */}
                    {includeStats && (
                      <div className="w-[550px] flex flex-col gap-[9px]">
                        {statsList.map((s, idx) => {
                          let homePct = 50;
                          let awayPct = 50;
                          const hVal = parseFloat(String(s.home).replace('%', '')) || 0;
                          const aVal = parseFloat(String(s.away).replace('%', '')) || 0;
                          const total = hVal + aVal;

                          if (s.isPossession) {
                            homePct = hVal || 50;
                            awayPct = 100 - homePct;
                          } else if (total > 0) {
                            homePct = Math.round((hVal / total) * 100);
                            awayPct = 100 - homePct;
                          }

                          return (
                            <div
                              key={idx}
                              className="bg-white rounded-[15px] h-[48px] px-5 flex items-center justify-between"
                              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)' }}
                            >
                              <div className="text-[25px] font-black text-[#0B1B3D] w-[60px] text-left">
                                {s.home}
                              </div>
                              <div className="flex flex-col items-center w-[260px]">
                                <div className="text-[12px] font-black text-[#0B1B3D] uppercase tracking-[0.6px] mb-1">
                                  {s.label}
                                </div>
                                <div className="w-[250px] h-[7px] bg-[#D1D5DB] rounded-full relative overflow-hidden flex">
                                  <div
                                    className="bg-[#B91C1C] h-full rounded-l-full"
                                    style={{ width: `${homePct}%` }}
                                  />
                                  <div
                                    className="bg-[#D1D5DB] h-full rounded-r-full"
                                    style={{ width: `${awayPct}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-[25px] font-black text-[#0B1B3D] w-[60px] text-right">
                                {s.away}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Footer Branding */}
                    <div className="relative z-10 flex flex-col items-center justify-center mt-[18px]">
                      <div className="flex items-center justify-center scale-90">
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

            {/* Direct 1-Click HD Download Action */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDirectDownload}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-sm transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>HD Image Download mek a ni (0.2s)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-100" />
                    <span>⬇️ Download HD Scorecard (819x1024 PNG)</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-stone-500 font-medium">
                Live Preview-a i hmuh ang chiah chiah hi full HD (819x1024) PNG-in i khawl-ah a in-download nghal ang.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
