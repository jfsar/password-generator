import "./styles.css";

class PasswordGenerator {
  static CHARSETS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    nums: "0123456789",
    syms: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  static WORDS = [
    "correct",
    "horse",
    "battery",
    "staple",
    "orange",
    "purple",
    "silver",
    "castle",
    "dragon",
    "forest",
    "river",
    "ocean",
    "mountain",
    "thunder",
    "winter",
    "summer",
    "candle",
    "mirror",
    "shadow",
    "rocket",
    "breeze",
    "cobalt",
    "falcon",
    "marble",
    "pebble",
    "ribbon",
    "timber",
    "velvet",
    "window",
    "zipper",
  ];

  constructor() {
    this.currentPw = "";
    this.hidden = false;
    this.passLenEl = document.getElementById("pw-len");
    this.generate();
    this.syncEyeUI();
    this.loadEvents();
  }

  loadEvents() {
    document
      .getElementById("eye-btn")
      .addEventListener("click", this.toggleVis.bind(this));

    document.querySelectorAll('input[name="pw-type"]').forEach((radio) => {
      radio.addEventListener("change", this.onTypeChange.bind(this));
    });

    document
      .getElementById("copy-btn")
      .addEventListener("click", this.copyPw.bind(this));

    document
      .querySelector(".dice-btn")
      .addEventListener("click", this.generate.bind(this));

    this.passLenEl.addEventListener("input", this.onLen.bind(this));

    document
      .getElementById("c-sym")
      .addEventListener("change", this.generate.bind(this));

    document
      .getElementById("c-num")
      .addEventListener("change", this.generate.bind(this));

    document
      .getElementById("c-alpha")
      .addEventListener("change", this.generate.bind(this));
  }

  generateRandomInt(max) {
    const arr = new Uint32Array(1);
    const UINT32_MAX_PLUS_ONE = 2 ** 32;
    const limit = Math.floor(UINT32_MAX_PLUS_ONE / max) * max;
    do {
      crypto.getRandomValues(arr);
    } while (arr[0] >= limit);

    return arr[0] % max;
  }

  generateRandomChar(str) {
    if (typeof str !== "string" || str.length === 0) {
      throw new Error("Invalid string input");
    }
    return str[this.generateRandomInt(str.length)];
  }

  getOptions() {
    return {
      type: document.querySelector('input[name="pw-type"]:checked').value,
      len: parseInt(this.passLenEl.value, 10),
      useAlpha: document.getElementById("c-alpha").checked,
      useNum: document.getElementById("c-num").checked,
      useSym: document.getElementById("c-sym").checked,
    };
  }

  buildCharset(options) {
    let charset = PasswordGenerator.CHARSETS.lower;
    if (options.useAlpha) charset += PasswordGenerator.CHARSETS.upper;
    if (options.useNum) charset += PasswordGenerator.CHARSETS.nums;
    if (options.useSym) charset += PasswordGenerator.CHARSETS.syms;

    return charset;
  }

  shuffleCharset(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.generateRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  generatePassword(options) {
    const charset = this.buildCharset(options);

    const passwordChars = [];

    passwordChars.push(
      this.generateRandomChar(PasswordGenerator.CHARSETS.lower),
    );

    if (options.useAlpha) {
      passwordChars.push(
        this.generateRandomChar(PasswordGenerator.CHARSETS.upper),
      );
    }

    if (options.useNum) {
      passwordChars.push(
        this.generateRandomChar(PasswordGenerator.CHARSETS.nums),
      );
    }

    if (options.useSym) {
      passwordChars.push(
        this.generateRandomChar(PasswordGenerator.CHARSETS.syms),
      );
    }

    const remainingLength = options.len - passwordChars.length;

    for (let i = 0; i < remainingLength; i++) {
      passwordChars.push(this.generateRandomChar(charset));
    }

    return this.shuffleCharset(passwordChars).join("");
  }

  generatePassphrase(wordCount) {
    const picked = Array.from(
      { length: wordCount },
      () =>
        PasswordGenerator.WORDS[
          this.generateRandomInt(PasswordGenerator.WORDS.length)
        ],
    );
    picked.push(String(this.generateRandomInt(100)));
    return this.shuffleCharset(picked).join("-");
  }

  calcEntropy(pw, opts) {
    let poolSize = PasswordGenerator.CHARSETS.lower.length;
    if (opts.useAlpha) poolSize += PasswordGenerator.CHARSETS.upper.length;
    if (opts.useNum) poolSize += PasswordGenerator.CHARSETS.nums.length;
    if (opts.useSym) poolSize += PasswordGenerator.CHARSETS.syms.length;
    return Math.floor(pw.length * Math.log2(poolSize));
  }

  onTypeChange() {
    const isPassphrase =
      document.querySelector('input[name="pw-type"]:checked').value ===
      "passphrase";
    ["lbl-alpha", "lbl-num", "lbl-sym"].forEach((id) => {
      const lbl = document.getElementById(id);
      const inp = lbl.querySelector("input");
      if (isPassphrase) {
        lbl.classList.add("disabled");
        inp.disabled = true;
      } else {
        lbl.classList.remove("disabled");
        inp.disabled = false;
      }
    });
    document
      .getElementById("checkboxes-group")
      .setAttribute("aria-disabled", String(isPassphrase));
    this.generate();
  }

  onLen() {
    const v = document.getElementById("pw-len").value;
    document.getElementById("len-label").textContent = "Character length: " + v;
    this.generate();
  }

  generate() {
    const opts = this.getOptions();
    const errEl = document.getElementById("error-msg");

    if (
      opts.type === "password" &&
      !opts.useAlpha &&
      !opts.useNum &&
      !opts.useSym
    ) {
      errEl.textContent = "Select at least one character type.";
      this.currentPw = "";
      this.renderPw();
      document.getElementById("s-bar").style.width = "0";
      document.getElementById("s-bar-wrap").setAttribute("aria-valuenow", "0");
      document.getElementById("s-text").textContent = "";
      return;
    }
    errEl.textContent = "";

    this.currentPw =
      opts.type === "passphrase"
        ? this.generatePassphrase(Math.max(3, Math.round(opts.len / 5)))
        : this.generatePassword(opts);

    this.renderPw();
    this.setStrength(opts);
  }

  renderPw() {
    const el = document.getElementById("pw-display");
    if (this.hidden) {
      el.textContent = "•".repeat(this.currentPw.length);
      el.classList.add("masked");
    } else {
      el.textContent = this.currentPw;
      el.classList.remove("masked");
    }
  }

  syncEyeUI() {
    const btn = document.getElementById("eye-btn");
    const icon = document.getElementById("eye-icon");
    btn.setAttribute("aria-pressed", String(!this.hidden));
    icon.innerHTML = this.hidden
      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  }

  toggleVis() {
    this.hidden = !this.hidden;
    this.syncEyeUI();
    this.renderPw();
  }

  copyPw() {
    if (!this.currentPw) return;
    const btn = document.getElementById("copy-btn");
    const succeed = () => {
      btn.textContent = "Copied!";
      btn.style.background = "#1d9e75";
      setTimeout(() => {
        btn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        btn.style.background = "#f0a500";
      }, 1500);
    };
    const fail = () => {
      btn.textContent = "Failed";
      btn.style.background = "#e24b4a";
      setTimeout(() => {
        btn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        btn.style.background = "#f0a500";
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.currentPw).then(succeed).catch(fail);
    } else {
      try {
        const ta = document.createElement("textarea");
        ta.value = this.currentPw;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        succeed();
      } catch {
        fail();
      }
    }
  }

  setStrength(opts) {
    const entropy =
      opts.type === "passphrase"
        ? this.currentPw.split("-").length *
          Math.log2(PasswordGenerator.WORDS.length)
        : this.calcEntropy(this.currentPw, opts);

    const levels = [
      { t: "Weak", c: "#e24b4a", w: "20%", icon: "!" },
      { t: "Fair", c: "#f97316", w: "45%", icon: "!" },
      { t: "Strong", c: "#3b82f6", w: "70%", icon: "✓" },
      { t: "Very strong", c: "#22c55e", w: "100%", icon: "✓" },
    ];

    const idx = entropy >= 60 ? 3 : entropy >= 45 ? 2 : entropy >= 30 ? 1 : 0;
    const lv = levels[idx];
    const bar = document.getElementById("s-bar");
    document
      .getElementById("s-bar-wrap")
      .setAttribute("aria-valuenow", parseInt(lv.w));
    bar.style.background = lv.c;
    bar.style.width = lv.w;
    const icon = document.getElementById("s-icon");
    icon.style.background = lv.c;
    icon.textContent = lv.icon;
    document.getElementById("s-text").textContent = lv.t + " password";
  }
}

export { PasswordGenerator };

if (typeof document !== "undefined" && document.getElementById("pw-display")) {
  new PasswordGenerator();
}
