import { useEffect, useRef } from "react";

const svgProps = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};
function IconBook() {
  return (
    <svg {...svgProps}>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
      <path d="M18 3v18" />
      <path d="M8 7h6M8 11h6" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg {...svgProps}>
      <path d="M6 7h12l1 13H5z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <path d="M12 8v13" />
      <path d="M12 8S10.5 3 8 4.5 9.5 8 12 8zM12 8s1.5-5 4-3.5S14.5 8 12 8z" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CoinPill({ coins }) {
  return (
    <div className="nav-coin" aria-label={`${coins} coins`}>
      <span className="nav-coin-icon" aria-hidden="true">◉</span>
      <strong>{coins}</strong>
    </div>
  );
}

function Stars({ count }) {
  return (
    <span className="nav-stars" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= count ? "on" : ""}>★</span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ Home */
export function HomeScreen({
  nav,
  coins,
  hasProgress,
  levelsDone,
  levelsTotal,
  starsEarned,
  starsTotal,
  onPlay,
  onContinue,
  onMap,
  onSettings,
  onCollection,
  onShop,
  onDaily,
  dailyReady,
  langSwitch,
}) {
  return (
    <section className="nav-screen nav-home" aria-label={nav.home}>
      <header className="nav-home-top">
        <CoinPill coins={coins} />
        {langSwitch}
      </header>

      <div className="nav-home-hero">
        <img src="/assets/tidy/home-hero.png" alt="" className="nav-home-art" />
        <h1 className="nav-home-title">Seedbound</h1>
        <p className="nav-home-tagline">{nav.tagline}</p>
      </div>

      <div className="nav-home-actions">
        {hasProgress ? (
          <>
            <button type="button" className="nav-btn nav-btn--primary" onClick={onContinue}>
              {nav.continue}
            </button>
            <button type="button" className="nav-btn nav-btn--ghost" onClick={onMap}>
              {nav.levelMap}
            </button>
          </>
        ) : (
          <button type="button" className="nav-btn nav-btn--primary" onClick={onPlay}>
            {nav.play}
          </button>
        )}
      </div>

      {hasProgress && (
        <div className="nav-home-progress">
          <span>{nav.levelProgress(levelsDone, levelsTotal)}</span>
          <span className="nav-home-progress-dot" aria-hidden="true">·</span>
          <span>{nav.starsCollected(starsEarned, starsTotal)}</span>
        </div>
      )}

      <nav className="nav-home-shortcuts" aria-label="Menu">
        <button type="button" className="nav-chip" onClick={onCollection}>
          <span className="nav-chip-icon"><IconBook /></span>
          {nav.collection}
        </button>
        <button type="button" className="nav-chip" onClick={onShop}>
          <span className="nav-chip-icon"><IconBag /></span>
          {nav.shop}
        </button>
        <button type="button" className="nav-chip" onClick={onDaily}>
          <span className="nav-chip-icon"><IconGift /></span>
          {nav.daily}
          {dailyReady && <span className="nav-chip-dot" aria-hidden="true" />}
        </button>
        <button type="button" className="nav-chip" onClick={onSettings}>
          <span className="nav-chip-icon"><IconGear /></span>
          {nav.settings}
        </button>
      </nav>
    </section>
  );
}

/* -------------------------------------------------------------- Level map */
export function LevelMapScreen({ nav, coins, campaign, unlockedCount, starsById, onPlayLevel, onBack }) {
  const currentRef = useRef(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <section className="nav-screen nav-map" aria-label={nav.mapTitle}>
      <header className="nav-bar">
        <button type="button" className="nav-back" onClick={onBack} aria-label={nav.back}>
          ‹ {nav.back}
        </button>
        <h2 className="nav-bar-title">{nav.mapTitle}</h2>
        <CoinPill coins={coins} />
      </header>
      <p className="nav-map-sub">{nav.mapSub}</p>

      <ol className="nav-map-list">
        {campaign.map((entry, index) => {
          const locked = index >= unlockedCount;
          const isCurrent = index === unlockedCount - 1;
          const stars = starsById[entry.id] || 0;
          const packing = !!entry.packing;
          return (
            <li
              key={entry.id}
              ref={isCurrent ? currentRef : null}
              className={`nav-node${locked ? " is-locked" : ""}${isCurrent ? " is-current" : ""}${index % 2 ? " is-right" : " is-left"}`}
            >
              <button
                type="button"
                className="nav-node-btn"
                disabled={locked}
                onClick={() => !locked && onPlayLevel(index)}
                aria-label={`${nav.levelN(index + 1)} — ${entry.theme.title}${locked ? ` (${nav.locked})` : ""}`}
              >
                <span className="nav-node-num">{locked ? "🔒" : index + 1}</span>
                <span className="nav-node-info">
                  <strong className="nav-node-name">{entry.theme.title}</strong>
                  <span className={`nav-node-type nav-node-type--${packing ? "pack" : "fridge"}`}>
                    {packing ? nav.packType : nav.fridgeType}
                  </span>
                </span>
                {!locked && <Stars count={stars} />}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- Settings */
export function SettingsScreen({ nav, muted, onToggleSound, locale, onSetLocale, onReset, onBack, langLabels }) {
  return (
    <section className="nav-screen nav-settings" aria-label={nav.settingsTitle}>
      <header className="nav-bar">
        <button type="button" className="nav-back" onClick={onBack} aria-label={nav.back}>
          ‹ {nav.back}
        </button>
        <h2 className="nav-bar-title">{nav.settingsTitle}</h2>
        <span className="nav-bar-spacer" />
      </header>

      <div className="nav-settings-list">
        <div className="nav-setting-row">
          <span className="nav-setting-label">{nav.sound}</span>
          <button
            type="button"
            className={`nav-toggle${muted ? "" : " is-on"}`}
            role="switch"
            aria-checked={!muted}
            onClick={onToggleSound}
          >
            <span className="nav-toggle-knob" />
            <span className="nav-toggle-text">{muted ? nav.soundOff : nav.soundOn}</span>
          </button>
        </div>

        <div className="nav-setting-row nav-setting-row--stack">
          <span className="nav-setting-label">{nav.language}</span>
          <div className="nav-lang-group" role="group" aria-label={nav.language}>
            {["pt", "en", "cn"].map((code) => (
              <button
                key={code}
                type="button"
                className={`nav-lang-btn${locale === code ? " is-active" : ""}`}
                onClick={() => onSetLocale(code)}
              >
                {langLabels[code]}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="nav-btn nav-btn--danger" onClick={onReset}>
          {nav.resetProgress}
        </button>

        <p className="nav-settings-credits">{nav.credits}</p>
      </div>
    </section>
  );
}
