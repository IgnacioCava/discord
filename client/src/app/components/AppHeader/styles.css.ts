import { style } from "@vanilla-extract/css"

export const Container = style({
  width: "100%",
  backgroundColor: "oklab(0.183076 0.00112209 -0.00388214)",
  alignItems: "center",
  display: "flex",
  gap: 8,
  justifyContent: "space-between",
  minHeight: 36,
  paddingLeft: 80,
  paddingRight: 12,
  position: "relative",
  gridArea: "titleBar",
})

export const Button = style({
  width: 32,
  height: 32,
  cursor: "pointer",
  alignItems: "center",
  color: `color-mix(
    in oklab,
    hsl(240 calc(1 * 4.294%) 68.039% /1) 100%,
    #000 0%
  )`,
  display: "flex",
  justifyContent: "center",
  margin: 0,
  backgroundColor: "transparent",
  outline: "none",
  border: "none",
})

export const ButtonContanier = style({
  justifyContent: 'flex-end',
  alignItems: 'center',
  display: 'flex',
  gap: '12px',
  position: 'relative',
  zIndex: 1,
})