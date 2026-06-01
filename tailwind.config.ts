import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        text: "#17181B",
        "text-2": "#6F7278",
        muted: "#aeb0b4",
        coral: "#ff7a45",
        amber: "#ffb020",
        deep: "#f15a2b",
        sand: "#FBF9F8",
        cream: "#FCFAF7",
        line: "#ECE7E1",
      },
      borderRadius: {
        input: "13px",
        card: "16px",
        btn: "12px",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
