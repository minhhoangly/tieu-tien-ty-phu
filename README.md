# Tiêu Tiền Tỷ Phú

A tiny static "spend the money" game in Vietnamese dong. You start with a big budget, buy and sell items from a catalogue (phở to private jets), and watch a running receipt.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no network requests.

## Run it

Open `index.html` in a browser, or serve the folder with any static server:

```
npx serve .
```

## Test it

```
npm test
```

Runs the unit tests in `test/` (formatting, purchase rules, interest, stack height, budget tiers and catalogue sanity) with Node's built-in test runner. Needs Node 18 or later.

## Layout

| Path | What it holds |
|---|---|
| `index.html` | Page structure and Vietnamese copy |
| `css/style.css` | Styles, responsive grid, light and dark theme |
| `js/core.js` | Pure logic: VND formatting, monthly interest, quantity limits, saved-data validation |
| `js/budgets.js` | The slider's wealth tiers, the USD→VND rate and the savings rate |
| `js/stack.js` | Banknote-stack maths: height from money, length formatting, landmark list and comparison text |
| `js/items.js` | The catalogue. Edit this to change what can be bought |
| `js/share.js` | Draws the receipt as a shareable PNG card with the Canvas API |
| `js/stackview.js` | Draws the stack height against landmarks on a logarithmic SVG ruler |
| `js/app.js` | DOM wiring, state, money-bar animation, receipt |
| `test/core.test.js` | Unit tests for `core.js` |
| `test/stack.test.js` | Unit tests for `stack.js` |
| `test/data.test.js` | Sanity checks for the budget tiers and the catalogue |

## Customising

- **Items:** edit `js/items.js`. Each item has an `id`, `name`, `price` (whole VND), `emoji`, optional `hue` and `limit`. The page sorts by price automatically.
- **Your own pictures:** add `image: 'images/pho.jpg'` to an item and it replaces the emoji tile.
- **Budgets:** a slider picks one of eight tiers, left (smallest) to right (largest): 8 thousand, 50 thousand, 80 thousand, 220 thousand, 800 thousand, 10 million, 1 billion and 40 billion USD. Edit the tiers in `js/budgets.js`; they are defined in USD and converted with `VND_PER_USD` (26,000), so the page shows VND throughout.
- **Interest box:** shows the monthly interest on the chosen tier's budget, as simple interest: budget × `ANNUAL_RATE` (5%) ÷ 12. It uses the tier you pick, not what you have left after shopping. Change the rate in `js/budgets.js`.
- **Numbers:** amounts are plain JS numbers, exact up to about 9 × 10^15 ₫. The top tier is about 1.04 × 10^15 ₫, so it fits, but a much larger budget would need BigInt.

## Receipt actions

Once you have bought something, the receipt offers:

- **Tạo thẻ chia sẻ (share card):** renders the receipt as a 1080 px wide PNG (top eight purchases, total, share of budget used, and the banknote-stack height) and opens a preview. From there you can **share** it (system share sheet, only shown where the browser supports sharing files), **download** it, or **copy the image** to the clipboard (only shown where image clipboard access exists). The image never leaves the browser unless you share it.
- **Chồng tiền cao bao nhiêu? (stack height):** stacks everything you spent as 500.000 ₫ notes, 0,1 mm thick each, and compares the height with real landmarks on a logarithmic ruler (each major tick is 10 times the one below it, because the range runs from under a millimetre to hundreds of kilometres). The thickness and the landmark heights live in `js/stack.js`; figures marked `approx` are round "about" numbers. Check them before publishing.
- **Làm lại từ đầu:** clears your purchases.

## Behaviour notes

- Buy is disabled when you cannot afford the item or have hit its limit. Typing a quantity is clamped to what you can afford.
- Progress is saved in your browser's `localStorage` and validated on load (unknown or outdated saves are ignored). Moving the slider previews the tier live; releasing it applies the tier and, if you have already bought things, asks before clearing them. The slider starts on the top-1% tier.
- The money bar animation respects the system "reduce motion" setting. A hidden status region announces the balance to screen readers.

## Prices and credits

Prices are rough market estimates for Vietnam and will drift. They are not quotes; check them before publishing. The same goes for the wealth tiers and rankings: they are illustrations supplied by the project owner, not audited statistics, and the top tier names a real person's reported fortune, so verify and date it before publishing.

The idea is inspired by Neal Agarwal's "Spend Bill Gates' Money". This project is an independent rewrite: the code, catalogue, copy and artwork here are original, and nothing was copied from that site. Tile artwork is system emoji; replace it with your own images if you want a distinctive look.
