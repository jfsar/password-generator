# Password Generator

A small, dependency-free web app that generates strong passwords and
passphrases directly in the browser. Built with vanilla JavaScript, bundled
with Webpack 5 + Babel, and tested with Jest under jsdom.

Everything runs client-side: no accounts, no network calls, no data leaves the
page.

## Features

- **Password mode** — random password from a configurable character pool.
- **Passphrase mode** — a hyphen-joined phrase built from a 30-word built-in
  wordlist plus a random number.
- **Cryptographically secure randomness** — uses `crypto.getRandomValues` with
  rejection sampling (never `Math.random`).
- **Guaranteed character variety** — at least one character from every selected
  set is included, then the result is shuffled.
- **Length slider** — 8 to 40 characters, default 20.
- **Strength meter** — estimated entropy mapped to Weak / Fair / Strong /
  Very strong.
- **Show/hide, copy, and dice-roll regenerate** — with clipboard fallback and a
  600 ms animated roll.
- **Accessible UI** — ARIA labels, live regions, `prefers-reduced-motion`
  support, and a `<noscript>` fallback.

## Tech stack

| Area          | Choice                                              |
| ------------- | --------------------------------------------------- |
| Language      | Vanilla JavaScript (ES modules, Babel-transpiled)   |
| Bundler       | Webpack 5 (`webpack-cli`, `webpack-dev-server`)     |
| Transpiler    | Babel (`@babel/core`, `@babel/preset-env`)          |
| HTML/CSS      | `html-webpack-plugin`, `css-loader`, `mini-css-extract-plugin` |
| Tests         | Jest 30 with `jest-environment-jsdom`               |

No framework, no runtime dependencies. All `dependencies` listed in
`package.json` are dev tooling.

## Project structure

```text
.
├── src/
│   ├── index.js        # PasswordGenerator class + auto-instantiation
│   ├── index.html      # UI markup / webpack HTML template
│   └── styles.css      # Claymorphic theme (imported by index.js)
├── test/
│   ├── index.test.js   # Jest suite (loads src/index.html as a fixture)
│   ├── setup.js        # Polyfills crypto for jsdom via node:crypto
│   └── styleMock.js    # Stubs CSS imports for Jest
├── jest.config.js      # jsdom test environment + Babel transform
├── webpack.config.js   # Entry, loaders, plugins, dev server
└── package.json        # Scripts and dev dependencies
```

`dist/` (build output), `node_modules/`, `AGENTS.md`, `design.md`, and the
`.agents/` / `.opencode/` folders are git-ignored.

## Architecture and data flow

The entire app is a single class, `PasswordGenerator`, in
[`src/index.js`](src/index.js). It is exported for testing and auto-instantiated
on load when the `#pw-display` element exists.

```text
User input (slider, checkboxes, radios, dice button)
        │
        ▼
  loadEvents() ──► getOptions()  (reads live DOM state by ID)
        │
        ├─ dice button ─► rollAndGenerate()  (600 ms animate, then generate)
        │
        ▼
  generate()
        ├─ password mode  ─► generatePassword()  ─┐
        └─ passphrase mode ─► generatePassphrase()─┤
                                                    ▼
                        buildCharset() → generateRandomInt()/generateRandomChar()
                                     → shuffleCharset() (Fisher–Yates)
                                                    │
                              renderPw()  ◄─────────┘
                              setStrength() → calcEntropy() → strength bar
```

Key details:

- **Character sets** (`PasswordGenerator.CHARSETS`): `lower` (a–z), `upper`
  (A–Z), `nums` (0–9), `syms` (`!@#$%^&*()_+-=[]{}|;:,.<>?`). Lowercase is
  always the base; optional sets extend the pool.
- **Randomness** (`generateRandomInt`): draws a `Uint32Array(1)` from
  `crypto.getRandomValues`, rejects values above a computed limit to avoid
  modulo bias, then applies `% max`.
- **Passphrase length**: word count is `Math.max(3, Math.round(len / 5))`, a
  numeric suffix is appended, and the parts are shuffled and joined with `-`.
- **Entropy / strength**: password entropy is
  `Math.floor(length * log2(poolSize))`; passphrase entropy uses word count and
  the wordlist size. Thresholds: `>= 60` Very strong, `>= 45` Strong,
  `>= 30` Fair, otherwise Weak.

### The `PasswordGenerator` class as an API

Although this is a browser app, the class is exported (`export { PasswordGenerator }`)
and can be driven programmatically:

```js
import { PasswordGenerator } from "./src/index.js";

const gen = new PasswordGenerator();

gen.generatePassword({ len: 20, useAlpha: true, useNum: true, useSym: true });
// => "aB3$x…" (random, always length 20)

gen.generatePassphrase(4);
// => "river-cobalt-42-orange-thunder" (4 words + numeric suffix, shuffled)

gen.generateRandomInt(52);
// => integer in [0, 52)

gen.calcEntropy("aB3$x", { useAlpha: true, useNum: true, useSym: true });
// => estimated entropy in bits (integer)
```

`getOptions()`, `renderPw()`, and `setStrength()` read and write DOM elements by
ID, so a document containing the expected IDs must exist. The test suite builds
that DOM from `src/index.html`.

## Getting started

### Prerequisites

- Node.js and npm. No Node version is pinned (`package.json` has no `engines`
  field). The repository was last verified with Node 26 and npm 11.
- A modern browser with `crypto.getRandomValues` and clipboard support.

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

`webpack-dev-server` serves the app on
[http://localhost:3000](http://localhost:3000) with hot reloading, gzip
compression, and a browser auto-open.

### Build for distribution

```bash
npm run build
```

Output is written to `dist/`:

| File          | Description                          |
| ------------- | ------------------------------------ |
| `index.html`  | Generated from `src/index.html`       |
| `bundle.js`   | Bundled JavaScript                    |
| `main.css`    | Extracted stylesheet                  |

To preview the production output, serve the `dist/` folder with any static file
server.

> **Note:** `webpack.config.js` hardcodes `mode: "development"`, so the bundle is
> not minified or optimized even for `npm run build`. Change the mode if you need
> a production build.

## Usage

1. Start the dev server (`npm run dev`) or open the built `dist/index.html`.
2. Choose **Password** or **Passphrase**.
   - In **Passphrase** mode the A–Z / 0–9 / !@# checkboxes are disabled,
     because the wordlist drives generation.
3. Drag the length slider (8–40). In passphrase mode the value controls how many
   words are produced.
4. In **Password** mode, toggle A–Z, 0–9, and !@#. At least one must stay
   selected, otherwise an error message appears and the display clears.
5. Click the dice to regenerate (with the roll animation), the eye to show/hide,
   and **Copy** to copy the result to the clipboard.

## Configuration and customization

There is no external configuration file or environment-based settings. Behavior
is defined in code:

| What                         | Where                                            |
| ---------------------------- | ------------------------------------------------ |
| Character sets               | `PasswordGenerator.CHARSETS` in `src/index.js`  |
| Wordlist                     | `PasswordGenerator.WORDS` in `src/index.js`      |
| Dice animation duration      | `this.rollDuration` (600 ms) in the constructor  |
| Length range / default       | `#pw-len` `min`, `max`, `value` in `src/index.html` |
| Strength thresholds          | `setStrength()` in `src/index.js`                |
| Port / dev server options    | `devServer` block in `webpack.config.js`         |

## Environment variables and secrets

None. The app is fully client-side and requires no environment variables, API
keys, or secret handling. All values are compiled into the bundle. Do not add
secrets to source files.

## Testing and quality checks

```bash
npm test        # run Jest once
npm run test:watch
```

- Tests live in `test/index.test.js` and run under jsdom. `test/setup.js`
  polyfills `crypto.getRandomValues` using Node's `node:crypto` webcrypto so
  generation works in the test environment.
- CSS imports are stubbed by `test/styleMock.js` via Jest's `moduleNameMapper`.
- **Last verified:** `npm test` → 1 suite passed, 6 tests passed.
- Coverage is **not** configured (no coverage script or thresholds). Running
  `jest --coverage` is possible but unverified in this repository.
- There is **no** linter, formatter, or type checker configured. Follow the
  existing code style.

## Deployment and CI/CD

- **No CI/CD is configured.** No `.github/` workflows or other pipeline
  definitions exist in the repository.
- `dist/` is git-ignored, so built artifacts are not committed; a deployment
  step must run `npm run build` first.
- The output is fully static and can be hosted on any static host.

`TODO`: choose and document a target host (for example GitHub Pages, Netlify,
or a CDN) and add a build/publish workflow.

## Contributing

1. Fork the repository and create a feature branch.
2. Make changes and run `npm test` before opening a pull request.
3. Keep the UI/JS contract intact: the JavaScript looks up elements by hardcoded
   IDs and selectors (`pw-display`, `pw-len`, `c-alpha`, `.dice-btn`, etc.).
   Renaming an ID in `src/index.html` requires updating `src/index.js` too.
4. Preserve cryptographic randomness — do not replace `crypto.getRandomValues`
   with `Math.random`.
5. Match the existing code style; no formatter is enforced.

There is currently no `CONTRIBUTING.md`; this section is the working guide.

## Troubleshooting and FAQ

- **`npm run dev` opens the wrong page or nothing.** The dev server serves the
  in-memory build on port 3000. Ensure nothing else is bound to that port.
- **`dist/` is empty after cloning.** It is git-ignored and generated on demand.
  Run `npm run build`.
- **I renamed an element and the app broke.** IDs are shared between
  `src/index.html` and `src/index.js`. Update both.
- **Generation throws `Invalid string input`.** `generateRandomChar` rejects
  empty/non-string input; ensure a usable character pool was built.
- **The strength bar always shows "Weak".** Very short passwords produce low
  entropy. Increase the length and enable more character sets.
- **Copy does nothing.** The app falls back to `document.execCommand("copy")`
  when the Clipboard API is unavailable; some browsers require a secure context
  (HTTPS or localhost).
- **The webpack `title` option seems ignored.** `HtmlWebpackPlugin` is
  configured with `title: "EasyCrypt"`, but `src/index.html` hardcodes its own
  `<title>Password Generator</title>`, so the plugin option has no effect.

## License and credits

- **License:** ISC (see `package.json`).
- **Author:** John Sarmiento.
- **Repository:** [github.com/jfsar/password-generator](https://github.com/jfsar/password-generator).

Titles and wordlist are project-specific; there are no third-party runtime
dependencies to credit.
