import { style } from "@vanilla-extract/css";

export const ServerListVanilla = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  height: "100%",
  minWidth: "72px",
  overflow: "hidden scroll",
  scrollbarGutter: "stable",
  backgroundColor: "oklab(0.183076 0.00112209 -0.00388214)",
  paddingBottom: "8px",
  "::-webkit-scrollbar": {
    width: "8px",
    backgroundColor: "transparent",
  },
});

export const separator = style({
  width: "32px",
  marginInline: "20px auto",
  minHeight: "1px",
  backgroundColor:
    "color-mix(in oklab, hsl(240 calc(1 * 4%) 60.784% /0.12156862745098039) 100%, hsl(0 0% 0% /0.12156862745098039) 0%)",
});

export const optionImg = style({
  backgroundColor: "#242222",
  cursor: "pointer",
  borderRadius: "8px",
});

export const optionWrapper = style({
  display: "flex",
  position: "relative",
  paddingLeft: "16px",
  "::after": {
    content: "",
    transition: "0.25s",
    width: "0px",
    height: "0%",
    left: -1,
    top: "50%",
    transform: "translateY(-50%)",
    position: "absolute",
    borderRadius: "0 4px 4px 0",
    backgroundColor:
      "color-mix(in oklab, hsl(0 calc(1 * 0%) 98.431% /1) 100%, #000 0%)",
  },
});

export const optionAfterActive = style({
  "::after": {
    width: "4px",
    height: "100%",
    left: 0,
  },
});

export const optionAfterNotification = style({
  "::after": {
    width: "4px",
    height: "8px",
    left: 0,
  },
});

export const optionAfterHover = style({
  selectors: {
    "&:hover::after": {
      width: "4px",
      height: "50%",
      left: 0,
    },
  },
});
