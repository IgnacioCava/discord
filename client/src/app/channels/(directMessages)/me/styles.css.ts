import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

export const MePageContainer = style({
  backgroundColor: "#1a1a1e",
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
});

export const FriendStatusTabs = style({
  border: "1px solid #29292d",
  borderInline: 1,
  padding: "8px 8px 8px 22px",
  display: "flex",
  alignItems: "center",
});

export const FriendStatusTitle = style({
  overflow: "hidden",
  whiteSpace: "nowrap",
  flex: " 0 0 auto",
  margin: "0 8px 0 0",
  minWidth: "auto",
  fontSize: "16px",
  fontWeight: "500",
  lineHeight: "1.25",
  width: "fit-content",
  height: "fit-content",
  display: "flex",
  alignItems: "center",
});

export const FriendStatusSeparator = style({
  color: "hsl(240 calc(1*4%) 60.784% /0.2)",
  margin: "0 4px",
});

// export const FriendStatusOption = style({
//   transition: "background-color .3s ease",
//   borderRadius: 8,
//   margin: "0 8px",
//   minHeight: "32px",
//   padding: "4px 12px",
//   color: "oklab(0.740158 0.00280195 -0.00954258)",
//   backgroundColor: "transparent",
//   border: 0,
//   alignItems: "center",
//   display: "flex",
//   justifyContent: "center",
//   minWidth: "40px",
//   textAlign: "center",
//   cursor: "pointer",
//   fontSize: "16px",
//   fontWeight: "500",
//   lineHeight: "20px",
//   position: "relative",
// });

export const FriendStatusOptionBase = style({
  transition: "background-color .3s ease",
  borderRadius: 8,
  margin: "0 8px",
  minHeight: "32px",
  padding: "4px 12px",
  color: "oklab(0.740158 0.00280195 -0.00954258)",
  backgroundColor: "transparent",
  border: 0,
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  minWidth: "40px",
  textAlign: "center",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "500",
  fontFamily: "inherit",
  lineHeight: "20px",
  position: "relative",
});

export const FriendStatusOption = recipe({
  base: [
    FriendStatusOptionBase,
    {
      ":hover": {
        backgroundColor: "hsl(240 calc(1*4%) 60.784% /0.2)",
        color: "oklab(0.988044 0.0000450313 0.0000197887)",
      },
    },
  ],
  variants: {
    active: {
      true: {
        backgroundColor: "hsl(240 calc(1*4%) 60.784% /0.12156862745098039)",
        color: "oklab(0.988044 0.0000450313 0.0000197887)",
        cursor: "default",
      },
    },
  },
});

export const AddFriendOption = recipe({
  base: [
    FriendStatusOptionBase,
    {
      color: "hsl(0 calc(1*0%) 100% /1)",
      borderColor: "hsl(0 calc(1*0%) 100% /0.0784313725490196)",
      backgroundColor: "hsl(234.935 calc(1*85.556%) 64.706% /1)",
      ":hover": {
        backgroundColor: "hsl(233.115 calc(1*49.194%) 51.373% /1)",
      },
    },
  ],
  variants: {
    active: {
      true: {
        backgroundColor:
          "hsl(234.935 calc(1*85.556%) 64.706% /0.1607843137254902)",
        color:
          "color-mix(in oklab, hsl(230.075 calc(1*97.08%) 73.137% /1) 100%, #000 0%)",
        cursor: "default",
        ":hover": {
          backgroundColor: "hsl(234.935 calc(1*85.556%) 64.706% /0.1607843137254902)",
        },
      },
    },
  },
});

export const SearchBarContainer = style({
  margin: "12px 16px 8px 24px",
});

export const SearchBar = style({
  //overflow: "hidden",
  backgroundColor:
    "color-mix(in oklab, hsl(240 calc(1*5.263%) 7.451% /1) 100%, #000 0%)",
  border:
    "1px solid color-mix(in oklab,hsl(240 calc(1*4%) 60.784% /0.2) 100%,hsl(0 0% 0% /0.2) 0%)",
  borderRadius: 8,
  ":focus": {
    outline: "1px solid red",
    outlineOffset: "1px",
  },
});

export const SearchBarInput = style({
  border: "none",
  appearance: "none",
  outline: "none",
  width: "100%",
  padding: "10px 12px",
  lineHeight: "20px",
  height: "unset",
  borderRadius: 8,
  ":focus": {
    outline: "1px solid #4c97f0",
  },
});

export const FriendList = style({
  overflow: "hidden scroll",
  height: "100%",
  paddingBottom: 8,
  "::-webkit-scrollbar": {
    width: "16px",
  },
  "::-webkit-scrollbar-thumb": {
    border: "6px solid transparent",
    backgroundClip: "padding-box",
    borderRadius: "8px",
    backgroundColor: "#5f606a",
  },
});

export const ListTitle = style({
  color:
    "color-mix(in oklab, hsl(240 calc(1*3.226%) 93.922% /1) 100%, #000 0%)",
  flex: "1 1 auto",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.2857142857142858,
  padding: "16px 20px 16px 24px",
});

export const FriendListItem = style({
  alignItems: "center",
  display: "flex",
  flexGrow: 1,
  justifyContent: "space-between",
  position: "relative",
  borderTop: "1px solid transparent",
  borderBottom: "1px solid transparent",
  verticalAlign: "baseline",
  height: 62,
  marginInline: "16px 10px",
  paddingInline: "8px 10px",
  transition: "background-color .2s ease",
  borderRadius: 8,
  "::after": {
    content: "",
    height: 1,
    backgroundColor: "hsl(240 calc(1*4%) 60.784% /0.0784313725490196)",
    position: "absolute",
    top: -1,
    left: 8,
    right: 10,
  },
  ":hover": {
    backgroundColor: "hsl(240 calc(1*4%) 60.784% /0.0784313725490196)",
  },
  selectors: {
    [`&:hover + &::after`]: {
      backgroundColor: "transparent",
    },
    "&:hover::after": {
      backgroundColor: "transparent",
    },
  },
});

export const FLIUserData = style({
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
});

export const FLIContainer = style({
  display: "flex",
  flexDirection: "column",
});

export const FLIUsername = style({
  color: "color-mix(in oklab, hsl(0 calc(1*0%) 98.431% /1) 100%, #000 0%)",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const FLIUserStatus = style({
  color:
    "color-mix(in oklab, hsl(240 calc(1*3.226%) 93.922% /1) 100%, #000 0%)",
  fontWeight: 400,
  fontSize: 14,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const FLIActions = style({
  display: "flex",
  marginLeft: "8px",
  gap: 10,
});

export const FLIAction = style({
  alignItems: "center",
  backgroundColor:
    "color-mix(in oklab, hsl(240 calc(1*7.143%) 10.98% /1) 100%, #000 0%)",
  borderRadius: "50%",
  color:
    "color-mix(in oklab, hsl(240 calc(1*4.294%) 68.039% /1) 100%, #000 0%)",
  cursor: "pointer",
  display: "flex",
  height: "36px",
  justifyContent: "center",
  width: "36px",
  border: 0,
});
