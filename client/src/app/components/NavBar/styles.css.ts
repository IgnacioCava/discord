import { style } from "@vanilla-extract/css";

export const Links = style({
  display: "flex",
  flexDirection: "row",
  gap: 10,
  position: "absolute",
  zIndex: 999,
});

export const StyledLink = style({
  padding: "5px",
  backgroundColor: "#10104b",
});
