import { assetUrl } from "../assetBase.js";
import { getSku } from "./model/storeModel.js";
import { ProductArt } from "./ProductArt.jsx";

export function StockBox({ skuId, quantity, loaded, onPick }) {
  const sku = getSku(skuId);
  return (
    <button
      type="button"
      className={`stock-box ${loaded ? "is-loaded" : ""}`}
      disabled={loaded}
      onClick={onPick}
    >
      <img className="stock-box-image" src={assetUrl(`objects/box-${skuId}.png`)} alt="" />
      <div className="stock-box-content">
        <ProductArt skuId={skuId} className="stock-box-product" />
        <span>{sku?.label || skuId}</span>
        <small>{quantity} units</small>
      </div>
    </button>
  );
}
