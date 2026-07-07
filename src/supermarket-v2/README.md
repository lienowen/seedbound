# Supermarket V2

A clean supermarket-restocking game line built around a real shift, not a fridge puzzle.

## Product rule

The player is a supermarket replenishment worker. Every mechanic must answer a real job question:

- What is out of stock?
- Where is the stock coming from?
- Which department owns the SKU?
- Does the shelf have capacity?
- Is older stock faced forward?
- Did a customer create a new gap?
- Is the aisle ready to trade?

## Keep from the existing app

- Phaser shell and pointer input
- generic drag feel helpers where they are not fridge-specific
- save/localization/build infrastructure
- asset loading primitives

## Do not import into V2

- fridge-br campaign data
- door/drawer zones
- right-side door rack goals
- legacy fridge nudges
- old fridge slot IDs
- old fridge constraint compatibility patches

## Core loop

1. Start shift and read priorities.
2. Go to backroom / receiving.
3. Load cases or crates onto a stock cart.
4. Move to the correct department.
5. Read visible shelf gaps.
6. Replenish within real shelf capacity.
7. Face the shelf.
8. React to customer removals, wrong delivery, damage or backstock.
9. Finish shift with availability, accuracy, facing and waste-control scores.

## Vertical slice

### Shift 1 — First Top-Up

- Scene: small wall-mounted beverage bay
- Source: one drinks case on stock cart
- Shelf: 3 visible gaps
- Action: open case, place 3 drinks, face row
- Win: all 3 facings filled

### Shift 2 — Breakfast Run

- Scene A: breakfast dry aisle
- Scene B: dairy wall cooler
- Source: one bread tray + one dairy crate
- Action: stock bread in dry aisle, then move to dairy wall for milk/yogurt/cheese
- Lesson: departments are physically different; no mixed giant cooler

### Shift 3 — Morning Rush

- Scene: dairy wall + drinks bay
- Dynamic event: customer removes one stocked item
- Action: finish first top-up, react to new gap, decide whether to recover it before second priority
- Lesson: shelves change while the worker is on shift

## Release gate for the vertical slice

A shift is not accepted unless:

- a new player understands the first action within 3 seconds
- stock origin is visible
- department placement is physically plausible
- no shelf is oversized relative to the task
- drag distance stays within a comfortable local interaction range
- the before/after shelf state is visually obvious
- the last item always completes when the work is correct
- no fridge-specific wording or slot logic appears
