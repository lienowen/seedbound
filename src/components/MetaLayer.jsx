import { useEffect } from "react";
import {
  CATALOG_ITEMS,
  CATALOG_TEXT,
  FRIDGE_SKINS,
  SKIN_TEXT,
  catalogImageUrl,
  dailyStatus,
  claimDaily,
  buySkin,
  equipSkin,
  skinById,
  discoveredCount,
} from "../meta/metaProgress.js";

// ---- Icons (no emoji, per design guidelines) --------------------------------
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
      <path d="M18 3v18" />
      <path d="M8 7h6M8 11h6" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l1 13H5z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <path d="M12 8v13" />
      <path d="M12 8S10.5 3 8 4.5 9.5 8 12 8zM12 8s1.5-5 4-3.5S14.5 8 12 8z" />
    </svg>
  );
}
function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2c1 3-1 5-2.5 6.5C8 10 7 11.5 7 13.5A5 5 0 0 0 17 14c0-2-1-3.5-2-5 .5 1 .5 2.5-.5 3.2.3-2.2-1-4.6-2.5-6.2C13 9 11.5 10 11 11c-.7-1.5.3-3.5 1-4.5C11.2 5 12 3 12 2z" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#f6c343" stroke="#d99a1e" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="#d99a1e" strokeWidth="1.6" />
    </svg>
  );
}

function CoinAmount({ value }) {
  return (
    <span className="meta-coin-amount">
      <IconCoin />
      {value}
    </span>
  );
}

// ---- Collection (food catalog) ----------------------------------------------
function CollectionPanel({ ui, locale, meta, onClose }) {
  const text = CATALOG_TEXT[locale] || CATALOG_TEXT.en;
  const found = discoveredCount(meta);
  return (
    <div className="meta-overlay" role="dialog" aria-modal="true" aria-label={ui.collectionTitle}>
      <div className="meta-panel">
        <header className="meta-panel-head">
          <div>
            <h2>{ui.collectionTitle}</h2>
            <p>{ui.collectionSub(found, CATALOG_ITEMS.length)}</p>
          </div>
          <button type="button" className="meta-close" onClick={onClose} aria-label={ui.close}>×</button>
        </header>
        <div className="meta-progress-track" aria-hidden="true">
          <div className="meta-progress-fill" style={{ width: `${(found / CATALOG_ITEMS.length) * 100}%` }} />
        </div>
        <div className="meta-collection-grid">
          {CATALOG_ITEMS.map((item) => {
            const unlocked = !!meta.discovered[item.id];
            const info = text[item.id] || { name: item.id, desc: "" };
            return (
              <div key={item.id} className={`meta-card meta-card--${item.rarity}${unlocked ? "" : " locked"}`}>
                <div className="meta-card-art">
                  {unlocked ? (
                    <img src={catalogImageUrl(item.image) || "/placeholder.svg"} alt={info.name} />
                  ) : (
                    <span className="meta-card-q">?</span>
                  )}
                </div>
                <strong>{unlocked ? info.name : ui.locked}</strong>
                {unlocked && <small>{info.desc}</small>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Shop (fridge skins) ----------------------------------------------------
function ShopPanel({ ui, locale, meta, coins, onBuy, onEquip, onClose }) {
  const names = SKIN_TEXT[locale] || SKIN_TEXT.en;
  return (
    <div className="meta-overlay" role="dialog" aria-modal="true" aria-label={ui.shopTitle}>
      <div className="meta-panel">
        <header className="meta-panel-head">
          <div>
            <h2>{ui.shopTitle}</h2>
            <p>{ui.shopSub}</p>
          </div>
          <div className="meta-head-coins"><CoinAmount value={coins} /></div>
          <button type="button" className="meta-close" onClick={onClose} aria-label={ui.close}>×</button>
        </header>
        <div className="meta-shop-grid">
          {FRIDGE_SKINS.map((skin) => {
            const owned = meta.shop.owned.includes(skin.id);
            const equipped = meta.shop.equipped === skin.id;
            const affordable = coins >= skin.price;
            return (
              <div key={skin.id} className={`meta-skin${equipped ? " equipped" : ""}`}>
                <div
                  className="meta-skin-swatch"
                  style={skin.pattern
                    ? { backgroundColor: skin.background, backgroundImage: `url(${skin.pattern})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: skin.background }}
                >
                  {!skin.pattern && <span className="meta-skin-dot" style={{ background: skin.swatch }} />}
                </div>
                <strong>{names[skin.id] || skin.id}</strong>
                {equipped ? (
                  <span className="meta-skin-tag equipped">{ui.equipped}</span>
                ) : owned ? (
                  <button type="button" className="meta-skin-btn" onClick={() => onEquip(skin.id)}>{ui.equip}</button>
                ) : (
                  <button
                    type="button"
                    className={`meta-skin-btn buy${affordable ? "" : " disabled"}`}
                    onClick={() => affordable && onBuy(skin.id)}
                    disabled={!affordable}
                    title={affordable ? "" : ui.cantAfford}
                  >
                    <IconCoin />{skin.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Daily reward modal -----------------------------------------------------
function DailyModal({ ui, meta, onClaim, onClose }) {
  const status = dailyStatus(meta);
  return (
    <div className="meta-overlay" role="dialog" aria-modal="true" aria-label={ui.dailyTitle}>
      <div className="meta-panel meta-panel--daily">
        <button type="button" className="meta-close" onClick={onClose} aria-label={ui.close}>×</button>
        <div className="meta-daily-gift" aria-hidden="true"><IconGift /></div>
        <h2>{ui.dailyTitle}</h2>
        <p>{ui.dailyStreakLabel(status.loginStreak)}</p>
        <div className="meta-daily-row">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const reached = i < status.loginStreak || (status.claimable && i === status.loginStreak - 1);
            const isToday = status.claimable && i === status.loginStreak - 1;
            return (
              <div key={i} className={`meta-daily-day${reached ? " reached" : ""}${isToday ? " today" : ""}`}>
                <span className="meta-daily-num">{i + 1}</span>
              </div>
            );
          })}
        </div>
        {status.claimable ? (
          <button type="button" className="meta-daily-claim" onClick={onClaim}>
            {ui.dailyClaim} <CoinAmount value={status.reward} />
          </button>
        ) : (
          <p className="meta-daily-done">{ui.dailyComeBack}</p>
        )}
      </div>
    </div>
  );
}

// ---- Discovery toast --------------------------------------------------------
function DiscoveryToast({ ui, locale, itemId }) {
  const text = CATALOG_TEXT[locale] || CATALOG_TEXT.en;
  const item = CATALOG_ITEMS.find((i) => i.id === itemId);
  if (!item) return null;
  const info = text[itemId] || { name: itemId };
  return (
    <div className="meta-discovery" role="status">
      <div className="meta-discovery-art">
        <img src={catalogImageUrl(item.image) || "/placeholder.svg"} alt={info.name} />
      </div>
      <div className="meta-discovery-body">
        <small>{ui.newDiscovery}</small>
        <strong>{info.name}</strong>
      </div>
    </div>
  );
}

// ---- Main layer -------------------------------------------------------------
export function MetaLayer({
  i18n,
  locale,
  coins,
  meta,
  onMetaChange,
  onAddCoins,
  onSpendCoins,
  discovery,
  autoOpenDaily,
  onDailyAutoHandled,
  panel,
  setPanel,
  showToolbar = true,
}) {
  const ui = i18n.ui.meta;
  const daily = dailyStatus(meta);

  // Auto-open the daily gift once per session when it's claimable.
  useEffect(() => {
    if (autoOpenDaily && daily.claimable) {
      setPanel("daily");
      onDailyAutoHandled?.();
    } else if (autoOpenDaily) {
      onDailyAutoHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenDaily]);

  function handleClaimDaily() {
    const { meta: next, reward } = claimDaily(meta);
    onMetaChange(next);
    if (reward > 0) onAddCoins(reward);
    setPanel(null);
  }

  function handleBuy(skinId) {
    const skin = skinById(skinId);
    if (!onSpendCoins(skin.price)) return;
    const { meta: bought, ok } = buySkin(meta, skinId);
    if (!ok) {
      onAddCoins(skin.price); // refund if purchase failed
      return;
    }
    const equipped = equipSkin(bought, skinId);
    onMetaChange(equipped);
  }

  function handleEquip(skinId) {
    onMetaChange(equipSkin(meta, skinId));
  }

  return (
    <>
      {showToolbar && (
        <div className="meta-toolbar">
          <button type="button" className="meta-tool" onClick={() => setPanel("collection")} aria-label={ui.collection} title={ui.collection}>
            <IconBook />
            <span className="meta-tool-count">{discoveredCount(meta)}/{CATALOG_ITEMS.length}</span>
          </button>
          <button type="button" className="meta-tool" onClick={() => setPanel("shop")} aria-label={ui.shop} title={ui.shop}>
            <IconBag />
          </button>
          <button type="button" className="meta-tool" onClick={() => setPanel("daily")} aria-label={ui.dailyTitle} title={ui.dailyTitle}>
            <IconGift />
            {daily.claimable && <span className="meta-badge-dot" aria-hidden="true" />}
          </button>
        </div>
      )}

      {showToolbar && meta.streak > 1 && (
        <div className="meta-streak" aria-label={ui.streakLabel(meta.streak)}>
          <IconFlame />
          <span>{meta.streak}</span>
        </div>
      )}

      {discovery && <DiscoveryToast ui={ui} locale={locale} itemId={discovery} />}

      {panel === "collection" && (
        <CollectionPanel ui={ui} locale={locale} meta={meta} onClose={() => setPanel(null)} />
      )}
      {panel === "shop" && (
        <ShopPanel
          ui={ui}
          locale={locale}
          meta={meta}
          coins={coins}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "daily" && (
        <DailyModal ui={ui} meta={meta} onClaim={handleClaimDaily} onClose={() => setPanel(null)} />
      )}
    </>
  );
}
