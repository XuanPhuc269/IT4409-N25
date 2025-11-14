// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        "home-heading-large": ["48px", "56px"],
        "home-heading-small": ["28px", "34px"],
        "course-deatails-heading-small": ["26px", "36px"],
        "course-deatails-heading-large": ["36px", "44px"],
        default: ["15px", "21px"],
      },
    },
  },
  plugins: [],
};
