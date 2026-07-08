import { assetUrl } from "../assetBase.js";

export function ReplenishmentCart({ items = [] }) {
  return (
    <div className="replenishment-cart">
      <img
        className="replenishment-cart-image"
        src={assetUrl("objects/cart.png")}
        alt="cart"
      />
      <div className="replenishment-cart-items">
        {items.map((item) => (
          <img
            key={item.id || item.skuId}
            src={assetUrl(`tidy/${item.skuId}.png`)}
            alt=""
          />
        ))}
      </div>
    </div>
  );
}
