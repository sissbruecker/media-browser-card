const { tailwindTransform } = require("postcss-lit");

module.exports = {
  content: {
    files: ["./*.js"],
    transform: {
      ts: tailwindTransform,
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
