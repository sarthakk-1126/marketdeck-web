# MarketDeck Navigation Contract v1

Status: LOCKED FOR IMPLEMENTATION

## Goal

A user moving between MarketDeck products should feel that they changed workspaces inside one platform, not navigated to a different website.

## Desktop global navigation

All five products must remain visibly discoverable in this canonical order:

MarketDeck | Screener | Charting | F&O | Commentary | Crypto World

The current product receives a clear active state using MarketDeck primary blue.

The global shell may also contain global search where supported, theme control where retained, sign in/account, help, and alerts where relevant.

Do not reorder products independently per application.

## Canonical destinations

- MarketDeck: https://marketdeck.in/
- Screener: https://marketdeck.in/screener/
- Charting: https://marketdeck.in/charts/
- F&O: https://marketdeck.in/futures-and-options/
- Commentary: use the currently configured valid destination until routing migration is separately approved
- Crypto World: use the currently configured valid destination until routing migration is separately approved

Apps should prefer existing configured base URLs/environment variables over duplicating hard-coded routing logic.

## Secondary navigation

Each product owns a second navigation layer beneath the global product navigation.

Reference structures:

StockProof: Home | Companies | Screener | Compare | Market Insights | Learning | Tools
Charting: Workspace | Watchlist | Scans | Market | Alerts
F&O: Chain | Strategy Builder | Backtest | Paper Trading | Liquidity Finder | Calculator | Historical Chain | Seasonality
Commentary: Search | Market View | Coverage | Status
Crypto: Overview | Markets | Research | Tax Tools | Filing Tools

Exact destinations remain controlled by each app. Do not delete functionality merely to shorten the row.

## Mobile discovery requirement

The five-product switcher must never exist only inside a hamburger or dropdown.

Structure:

[ MarketDeck / current product                                  Account ]
[ Screener ] [ Charting ] [ F&O ] [ Commentary ] [ Crypto World ] ->

Requirements:
- persistent immediately below the top header
- horizontally scrollable when necessary
- active product clearly selected
- no wrapping to multiple rows
- usable at 320px width
- keyboard accessible
- touch friendly
- clear visual indication that more items can be scrolled into view
- first and last items must not be permanently clipped

The app-specific navigation may be a second horizontal rail or compact menu. The global product rail itself may not be hidden.

## Sidebar products

Desktop products that use a sidebar may repeat the five products for fast switching. Ordering, naming and active state must match the global contract. Repeating them in the sidebar never replaces the mobile product rail.

## Naming

Use these suite names consistently:
- MarketDeck
- Screener / StockProof where product-brand context requires it
- Charting
- F&O
- Commentary
- Crypto World

## Account controls

Authentication remains owned by platform-core and existing app integrations. UI work may normalize appearance, spacing and placement but must not alter login, signup, session, permissions, progressive-auth rules or redirects.

## Accessibility

Use semantic nav landmarks and useful aria labels. Current location should be conveyed beyond color alone when practical. All navigation must support keyboard focus.

## Cross-product consistency

Across product changes the following must remain consistent:
- global header height
- product order
- active-state treatment
- typography
- control geometry
- primary blue
- background family

This is the minimum bar for MarketDeck to read as one product.