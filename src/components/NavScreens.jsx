import { useEffect, useRef } from "react";
import { assetUrl } from "../assetBase.js";

const HOME_HERO_SRC = assetUrl("tidy/home-hero-market.png");

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

function IconHelp() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// Requirement badge pictograms — kept visually in sync with drawNeedIcon()
// in StorageScene.js so the legend matches what players see on items.
const badgeProps = {
  viewBox: "0 0 32 32",
  width: 30,
  height: 30,
  "aria-hidden": true,
};
function badgeInk(alert) {
  return alert ? "#6b3410" : "#a9772f";
}
function BadgeBase({ alert = false, children }) {
  return (
    <svg {...badgeProps}>
      <circle cx="16" cy="16" r="14" fill={alert ? "#ffb347" : "#fff1d6"} stroke="#ffffff" strokeWidth="3" />
      <g
        transform="translate(16 16)"
        fill="none"
        stroke={badgeInk(alert)}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}
function NeedIcon({ need, alert }) {
  const ink = badgeInk(alert);
  switch (need) {
    case "cold":
      return (
        <BadgeBase alert={alert}>
          {[90, 210, 330].map((deg) => {
            const r = (deg * Math.PI) / 180;
            const x = Math.cos(r) * 6.5;
            const y = Math.sin(r) * 6.5;
            return <line key={deg} x1={-x} y1={-y} x2={x} y2={y} />;
          })}
        </BadgeBase>
      );
    case "warm":
      return (
        <BadgeBase alert={alert}>
          <circle cx="0" cy="0" r="3.2" fill={ink} stroke="none" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (Math.PI / 4) * i;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 5.4}
                y1={Math.sin(a) * 5.4}
                x2={Math.cos(a) * 8.6}
                y2={Math.sin(a) * 8.6}
              />
            );
          })}
        </BadgeBase>
      );
    case "top":
      return (
        <BadgeBase alert={alert}>
          <line x1="-6" y1="6" x2="6" y2="6" />
          <polyline points="-5,-0.5 0,-6 5,-0.5" />
          <line x1="0" y1="-6" x2="0" y2="3" />
        </BadgeBase>
      );
    case "visible":
      return (
        <BadgeBase alert={alert}>
          <ellipse cx="0" cy="0" rx="8" ry="4.5" />
          <circle cx="0" cy="0" r="2.4" fill={ink} stroke="none" />
        </BadgeBase>
      );
    case "hates":
      return (
        <BadgeBase alert={alert}>
          <circle cx="0" cy="0" r="7" />
          <line x1="-4.9" y1="-4.9" x2="4.9" y2="4.9" />
        </BadgeBase>
      );
    case "zone":
    default:
      return (
        <BadgeBase alert={alert}>
          <line x1="-6" y1="-3" x2="6" y2="-3" />
          <line x1="-6" y1="3" x2="6" y2="3" />
        </BadgeBase>
      );
  }
}

/* ---------------------------------------------------------- How to play */
export function HelpScreen({ nav, help, onBack }) {
  const legend = [
    { need: "cold", name: help.needCold, desc: help.needColdDesc },
    { need: "warm", name: help.needWarm, desc: help.needWarmDesc },
    { need: "top", name: help.needTop, desc: help.needTopDesc },
    { need: "zone", name: help.needZone, desc: help.needZoneDesc },
    { need: "visible", name: help.needVisible, desc: help.needVisibleDesc },
    { need: "hates", name: help.needHates, desc: help.needHatesDesc },
  ];
  return (
    <section className="nav-screen nav-help" aria-label={help.title}>
      <header className="nav-bar">
        <button type="button" className="nav-back" onClick={onBack} aria-label={nav.back}>
          ‹ {nav.back}
        </button>
        <h2 className="nav-bar-title">{help.title}</h2>
        <span className="nav-bar-spacer" />
      </header>
      <p className="nav-help-sub">{help.subtitle}</p>

      <div className="nav-help-modes">
        <article className="nav-help-mode">
          <span className="nav-help-tag nav-help-tag--fridge">{nav.fridgeType}</span>
          <h3>{help.fridgeTitle}</h3>
          <p>{help.fridgeBody}</p>
        </article>
        <article className="nav-help-mode">
          <span className="nav-help-tag nav-help-tag--pack">{nav.packType}</span>
          <h3>{help.packTitle}</h3>
          <p>{help.packBody}</p>
        </article>
      </div>

      <h3 className="nav-help-section">{help.legendTitle}</h3>
      <p className="nav-help-legend-sub">{help.legendSub}</p>
      <ul className="nav-help-legend">
        {legend.map((row) => (
          <li key={row.need} className="nav-help-legend-row">
            <span className="nav-help-badge"><NeedIcon need={row.need} /></span>
            <span className="nav-help-legend-text">
              <strong>{row.name}</strong>
              <small>{row.desc}</small>
            </span>
          </li>
        ))}
      </ul>

      <h3 className="nav-help-section">{help.tipsTitle}</h3>
      <ul className="nav-help-tips">
        <li>{help.tip1}</li>
        <li>{help.tip2}</li>
        <li>{help.tip3}</li>
      </ul>
    </section>
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
  onHelp,
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
        <img src={HOME_HERO_SRC} alt="" className="nav-home-art" />
        <h1 className="nav-home-title">Cozy Shelf</h1>
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
        <button type="button" className="nav-chip" onClick={onHelp}>
          <span className="nav-chip-icon"><IconHelp /></span>
          {nav.howToPlay}
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
function ZoneGlyph({ kind }) {
  // Simple line icons (no emoji) — a cold cabinet vs a shelf gondola.
  if (kind === "fridge") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="2.5" width="14" height="19" rx="2.2" />
        <line x1="5" y1="10" x2="19" y2="10" />
        <line x1="8.5" y1="5" x2="8.5" y2="7.5" />
        <line x1="8.5" y1="13" x2="8.5" y2="16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1.6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="7" y1="7" x2="7" y2="9.5" />
      <line x1="12" y1="7" x2="12" y2="9.5" />
      <line x1="17" y1="7" x2="17" y2="9.5" />
    </svg>
  );
}

export function LevelMapScreen({ nav, coins, campaign, zones = [], unlockedCount, starsById, onPlayLevel, onBack }) {
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

      {zones.length > 0 && (
        <div className="store-map" aria-label={nav.storeMap}>
          <div className="store-map-head">
            <h3 className="store-map-title">{nav.storeMap}</h3>
            <p className="store-map-sub">{nav.storeMapSub}</p>
          </div>
          <ul className="store-map-zones">
            {zones.map((z) => {
              const complete = !z.locked && z.done >= z.total;
              const pct = z.total ? Math.round((z.done / z.total) * 100) : 0;
              return (
                <li key={z.id} className={`store-zone store-zone--${z.kind}${z.locked ? " is-locked" : ""}${complete ? " is-complete" : ""}`}>
                  <button
                    type="button"
                    className="store-zone-btn"
                    disabled={z.locked}
                    onClick={() => !z.locked && onPlayLevel(z.playIndex)}
                    aria-label={`${z.name}${z.locked ? ` — ${nav.zoneLockedAt(z.unlockLevel)}` : ` — ${nav.zoneProgress(z.done, z.total)}`}`}
                  >
                    <span className="store-zone-glyph">
                      {z.locked ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : (
                        <ZoneGlyph kind={z.kind} />
                      )}
                    </span>
                    <span className="store-zone-body">
                      <span className="store-zone-name">{z.name}</span>
                      <span className="store-zone-meta">
                        {z.locked ? nav.zoneLockedAt(z.unlockLevel) : complete ? nav.zoneDone : nav.zoneProgress(z.done, z.total)}
                      </span>
                      {!z.locked && (
                        <span className="store-zone-bar" aria-hidden="true">
                          <span className="store-zone-fill" style={{ width: `${pct}%` }} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="nav-map-sub">{nav.mapSub}</p>

      <ol className="nav-map-list">
        {campaign.map((entry, index) => {
          const locked = index >= unlockedCount;
          const isCurrent = index === unlockedCount - 1;
          const stars = starsById[entry.id] || 0;
          const packing = !!entry.packing;
          const pantry = entry.theme?.key === "pantry";
          const typeMod = packing ? "pack" : pantry ? "pantry" : "fridge";
          const typeLabel = packing ? nav.packType : pantry ? nav.pantryType : nav.fridgeType;
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
                  <span className={`nav-node-type nav-node-type--${typeMod}`}>
                    {typeLabel}
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
export function SettingsScreen({ nav, muted, onToggleSound, onReset, onBack }) {
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

        <button type="button" className="nav-btn nav-btn--danger" onClick={onReset}>
          {nav.resetProgress}
        </button>

        <p className="nav-settings-credits">{nav.credits}</p>
      </div>
    </section>
  );
}
