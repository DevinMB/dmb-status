// Pixel sprite — 16×26 grid. Letter → CSS color. '_' = transparent.
const C = {
  _: null,
  O: '#111111',  // outline / dark
  S: '#F5C9A0',  // skin
  W: '#794d30',  // hair
  T: '#00BCD4',  // shirt base
  F: '#FF7043',  // floral accent
  Y: '#FFD600',  // flower
  G: '#66BB6A',  // green leaf
  K: '#FFFFFF',  // white collar
  B: '#37474F',  // dark pants
  X: '#1A1A1A',  // shoes
};

// prettier-ignore
const BASE_ROWS = [
  '________W_______',
  '_______WW_______',
  '_____WWWWWWWW___',
  '___WWWWWWWWWWW__',
  '__WWWWWWWWWWWWW_',
  '___WSSSSSSSSW___',
  '___WSOSSSSOSW___',
  '____SSSSSSSS____',
  null,
  null,
  '____SSSSSSS_____',
  '__KKTTTTTTTKK___',
  '_TTTFTTTTFTTTTT_',
  '_TTTTYGTTTTTTT__',
  '_TFTTTTTTTFTTT__',
  'STTTFTTTTTTTTS__',
  'STTTTTTTTTTTTS__',
  '__OBBBBBBBBBBO__',
  '___BBBB__BBBB___',
  '___BBBB__BBBB___',
  '___BBBB__BBBB___',
  '___BBBB__BBBB___',
  '___XBBB__BBBX___',
  '___XXXX__XXXX___',
  '___XXXX__XXXX___',
  '___XXXX__XXXX___',
  '___XXXX__XXXX___',
];

const HAPPY_A = '___WSSOSSOSSW___';
const HAPPY_B = '___WSSSOOSSW___';
const SAD_A   = '___WSSSOOOSSW___';
const SAD_B   = '___WSSOSSOSSW___';

function buildGrid(mood) {
  return BASE_ROWS.map((r, i) => {
    const str = i === 8 ? (mood === 'happy' ? HAPPY_A : SAD_A)
              : i === 9 ? (mood === 'happy' ? HAPPY_B : SAD_B)
              : r;
    return str.split('').map((ch) => C[ch] ?? null);
  });
}

const SCALE = 3;

function Sprite({ mood }) {
  const grid = buildGrid(mood);
  return (
    <div className="pixel-sprite">
      {grid.map((row, y) => (
        <div key={y} className="pixel-row">
          {row.map((color, x) => (
            <div key={x} style={{ width: SCALE, height: SCALE, background: color ?? 'transparent' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProfileCard({ vitals, activity, sleep, lastRefresh, mood = 'happy' }) {
  const hr         = vitals?.heart_rate?.state;
  const steps      = activity?.daily_steps?.state;
  const detected   = activity?.detected_activity?.state;
  const sleepEntry = sleep?.sleep_total_hours;
  const sleepLabel = sleepEntry?.label ?? (sleepEntry?.state != null ? `${sleepEntry.state}h` : null);

  const now = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { timeZone: 'America/Detroit', hour12: true })
    : '—';

  const badgeClass = ['still', 'walking', 'running', 'cycling'].includes(detected)
    ? detected
    : 'unknown';

  return (
    <div className="profile-strip">
      <div className="profile-sprite-wrap">
        <Sprite mood={mood} />
      </div>

      <div className="profile-info">
        <span className="profile-name">Devin</span>
        <span className="profile-sub">as of {now}</span>
        {detected && <span className={`activity-badge ${badgeClass}`}>{detected}</span>}
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-label">♥ BPM</span>
          <span className="profile-stat-value">{hr ?? '—'}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Steps</span>
          <span className="profile-stat-value">{steps != null ? Number(steps).toLocaleString() : '—'}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Sleep</span>
          <span className="profile-stat-value">{sleepLabel ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
