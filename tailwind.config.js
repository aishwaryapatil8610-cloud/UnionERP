const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: c("bg"), panel: c("panel"), soft: c("soft"), line: c("line"), ink: c("ink"), mute: c("mute"),
        brand: c("brand"), accent: c("accent"), deep: c("deep"), cream: c("cream"), cow: c("cow"), buffalo: c("buffalo"), goat: c("goat"),
        danger: c("danger"), ok: c("ok"), warn: c("warn"),
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["\"Plus Jakarta Sans\"", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 1px 0 rgb(var(--line) / .7), 0 14px 34px -18px rgb(var(--deep) / .30)",
        pop: "0 26px 64px -22px rgb(var(--deep) / .50)",
      },
      keyframes: {
        wave: { to: { transform: "translateX(-90px)" } },
        drift: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        ring: { "0%": { transform: "scale(.6)", opacity: ".7" }, "100%": { transform: "scale(2.2)", opacity: "0" } },
        shimmer: { to: { backgroundPosition: "-200% 0" } },
        drive: { "0%": { transform: "translateX(-120%)" }, "100%": { transform: "translateX(320%)" } },
      },
      animation: {
        wave: "wave 5s linear infinite",
        "wave-slow": "wave 9s linear infinite reverse",
        drift: "drift 6s ease-in-out infinite",
        ring: "ring 2s ease-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        drive: "drive 9s linear infinite",
      },
    },
  },
  plugins: [],
};
