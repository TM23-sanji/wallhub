// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/(button|divider|toggle|ripple|spinner).js"
],
  theme: {
    extend: {},
    keyframes:{
      "caret-blink": {
        "0%,70%,100%": { opacity: "1" },
        "20%,50%": { opacity: "0" },
      },
    },
    animation:{
      "caret-blink": "caret-blink 1.25s ease-out infinite",
    }
  },
  darkMode: "class",
  plugins: [heroui()],
};