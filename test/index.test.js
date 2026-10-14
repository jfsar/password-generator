const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const { PasswordGenerator } = require("../src/index.js");

const html = readFileSync(join(__dirname, "..", "src", "index.html"), "utf8");
const body = html
  .replace(/[\s\S]*<body[^>]*>/i, "")
  .replace(/<\/body>[\s\S]*/i, "");

const checkboxes = ["c-alpha", "c-num", "c-sym"];

function selectType(value) {
  document.querySelectorAll('input[name="pw-type"]').forEach((radio) => {
    radio.checked = radio.value === value;
  });
  document
    .querySelector('input[name="pw-type"]:checked')
    .dispatchEvent(new Event("change"));
}

let gen;

beforeEach(() => {
  document.body.innerHTML = body;
  gen = new PasswordGenerator();
});

describe("type change", () => {
  it("disables character-type checkboxes in passphrase mode", () => {
    selectType("passphrase");

    checkboxes.forEach((id) => {
      expect(document.getElementById(id).disabled).toBe(true);
    });
    expect(
      document.getElementById("checkboxes-group").getAttribute("aria-disabled"),
    ).toBe("true");

    selectType("password");

    checkboxes.forEach((id) => {
      expect(document.getElementById(id).disabled).toBe(false);
    });
    expect(
      document.getElementById("checkboxes-group").getAttribute("aria-disabled"),
    ).toBe("false");
  });
});

describe("generatePassword", () => {
  it("respects selected sets and requested length", () => {
    const pw = gen.generatePassword({
      type: "password",
      len: 20,
      useAlpha: true,
      useNum: true,
      useSym: true,
    });

    expect(pw).toHaveLength(20);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[^A-Za-z0-9]/);
  });

  it("falls back to lowercase-only when no optional set is selected", () => {
    const pw = gen.generatePassword({
      type: "password",
      len: 12,
      useAlpha: false,
      useNum: false,
      useSym: false,
    });

    expect(pw).toHaveLength(12);
    expect(pw).toMatch(/^[a-z]+$/);
  });
});

describe("generateRandomInt", () => {
  it("returns an integer within [0, max)", () => {
    [1, 26, 52, 62, 89].forEach((max) => {
      for (let i = 0; i < 1000; i++) {
        const r = gen.generateRandomInt(max);
        expect(Number.isInteger(r)).toBe(true);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(max);
      }
    });
  });
});

describe("generatePassphrase", () => {
  it("produces wordlist words plus a numeric suffix", () => {
    const parts = gen.generatePassphrase(4).split("-");
    const numeric = parts.filter((p) => /^\d+$/.test(p));
    const words = parts.filter((p) => PasswordGenerator.WORDS.includes(p));

    expect(parts).toHaveLength(5);
    expect(numeric).toHaveLength(1);
    expect(words).toHaveLength(4);
  });
});

describe("validation", () => {
  it("clears a stale password when no character type is selected", () => {
    gen.generate();
    expect(gen.currentPw).not.toBe("");
    expect(document.getElementById("pw-display").textContent).not.toBe("");

    checkboxes.forEach((id) => {
      document.getElementById(id).checked = false;
    });
    gen.generate();

    expect(document.getElementById("error-msg").textContent).not.toBe("");
    expect(gen.currentPw).toBe("");
    expect(document.getElementById("pw-display").textContent).toBe("");
    expect(document.getElementById("s-text").textContent).toBe("");
  });
});
