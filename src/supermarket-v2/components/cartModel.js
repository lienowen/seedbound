export function buildCartState(items = []) {
  return {
    items,
    capacity: 12,
    used: items.length,
    isFull: items.length >= 12,
  };
}

export function addCartItem(cart, item) {
  if (cart.isFull) return cart;
  const items = [...cart.items, item];
  return buildCartState(items);
}
