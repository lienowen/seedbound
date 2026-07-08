import { assetUrl } from "../assetBase.js";
import { getSku } from "./model/storeModel.js";

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
        <img className="stock-box-product" src={assetUrl(`tidy/${skuId}.png`)} alt={sku?.label || skuId} />
        <span>{sku?.label || skuId}</span>
        <small>{quantity} units</small>
      </div>
    </button>
  );
}
