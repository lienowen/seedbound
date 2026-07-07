import { useState } from "react";
import { assetUrl } from "../../assetBase.js";
import { getSku, visibleGapCount } from "../model/storeModel.js";

export function ProductImage({ skuId, className = "" }) {
  const [failed, setFailed] = useState(false);
  const sku = getSku(skuId);
  if (failed) {
    return (
      <span className={`v2-product-fallback ${className}`} aria-label={sku?.label || skuId}>
        {(sku?.label || skuId).slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className={className}
      src={assetUrl(`tidy/${skuId}.png`)}
      alt={sku?.label || skuId}
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

export function locationName(scene) {
  if (!scene) return "Shop floor";
  if (scene.kind === "backroom") return "Backroom";
  if (scene.department === "dairy") return "Dairy wall";
  if (scene.department === "drinks") return "Drinks wall";
  return scene.department || "Shop floor";
}

export function WallBay({ bay }) {
  const used = bay.facings.reduce((sum, facing) => sum + Math.max(1, Number(facing.footprint || 1)), 0);
  const gaps = Math.max(0, bay.capacity - used);
  return (
    <div className={`v2-wall-cooler ${visibleGapCount(bay) === 0 ? "is-full" : ""}`}>
      <div className="v2-cooler-top">
        <strong>{String(bay.department).toUpperCase()}</strong>
        <span>Wall cooler · {bay.capacity} facings</span>
      </div>
      <div className="v2-cooler-light" />
      <div className="v2-cooler-interior" data-bay-id={bay.id}>
        <div className="v2-facing-row" data-bay-id={bay.id} style={{ gridTemplateColumns: `repeat(${bay.capacity}, minmax(0, 1fr))` }}>
          {bay.facings.map((facing, index) => (
            <div className="v2-facing-cell is-filled" key={facing.unitId}>
              <div className={`v2-shelf-product ${bay.faced ? "is-faced" : `is-unfaced is-unfaced-${index % 3}`}`}>
                <ProductImage skuId={facing.skuId} />
              </div>
            </div>
          ))}
          {Array.from({ length: gaps }, (_, index) => (
            <div className="v2-facing-cell is-gap" key={`gap-${index}`}>
              <div className="v2-visible-gap"><span /><small>GAP</small></div>
            </div>
          ))}
        </div>
        <div className="v2-shelf-lip"><span>{String(bay.department).toUpperCase()} · KEEP CHILLED</span></div>
      </div>
      <div className="v2-cooler-foot" />
    </div>
  );
}

export function RushCart({ state, drag, beginDrag, moveDrag, endDrag }) {
  return (
    <div className="v2-stock-cart v2-stock-cart--floor">
      <div className="v2-cart-handle" />
      <div className="v2-cart-label">YOUR CART <span>{state.cart.length} units</span></div>
      <div className="v2-cart-deck v2-cart-deck--draggable">
        {state.cart.length ? state.cart.map((unit) => (
          <button
            className={`v2-draggable-unit ${drag?.unitId === unit.id ? "is-dragging" : ""}`}
            key={unit.id}
            type="button"
            onPointerDown={(event) => beginDrag(event, unit)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <ProductImage skuId={unit.skuId} />
            <small>{getSku(unit.skuId)?.label}</small>
          </button>
        )) : <span className="v2-cart-empty">Cart empty</span>}
      </div>
      <div className="v2-cart-wheel v2-cart-wheel--a" />
      <div className="v2-cart-wheel v2-cart-wheel--b" />
    </div>
  );
}
