import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

export const Container = style({
  flex: 1,
  height: "100%",
  backgroundColor: "oklab(0.183076 0.00112209 -0.00388214)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  fontFamily: '"Segoe UI", sans-serif',
  border: "1px solid #222225",
  borderWidth: "1px 0 0 1px",
  borderTopLeftRadius: "12px",
  overflow: "hidden",
  backgroundAttachment: "scroll",
});

export const Header = style({
  padding: "10px",
  fontSize: "16px",
  fontWeight: "bold",
  borderBottom: "1px solid #202225",
  height: "48px",
  display: "flex",
  flex: "0 0 auto",
  alignItems: "center",
});

export const TabList = style({
  display: "flex",
  flexDirection: "column",
  marginTop: "8px",
  marginLeft: "8px",
  gap: "2px",
});

export const Tab = recipe({
  base: {
    display: "flex",
    flexDirection: "row",
    padding: "9px 16px 9px 8px",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "8px",
    lineHeight: "20px",
    fontWeight: 500,
    ":hover": {
      backgroundColor: "#1d1d1e",
    },
    ":active": {
      backgroundColor: "#27272b",
    },
  },
  variants: {
    active: {
      true: {
        color: "#fff",
        backgroundColor: "#27272b",
      },
      false: {
        color: "#b9bbbe",
        backgroundColor: "transparent",
      },
    },
  },
});

export const Divider = style({
  backgroundColor: "#202225",
  border: 0,
  boxShadow: "border-box",
  height: "1px",
  margin: "12px 8px",
  width: "100%",
});

export const FriendsSection = style({
  flexGrow: 1,
  overflowY: "auto",
  marginLeft: "8px",
  marginBottom: "8px",
  gap: "2px",
  display: "flex",
  flexDirection: "column",
});

export const FriendItem = style({
  padding: "0px 8px 0 8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "16px",
  fontWeight: "500",
  color: "oklab(0.671175 0.00174934 -0.010144)",
  borderRadius: "8px",
  cursor: "pointer",
  height: "42px",
  ":hover": {
    backgroundColor: "#1d1d1e",
  },
  ":active": {
    backgroundColor: "#27272b",
    transition: "0.1s",
  },
  selectors: {
    "&:is(:hover, :active)": {
      color: "oklab(0.952331 0.000418991 -0.00125992)",
    },
    // svg {
    //     color: oklab(0.952331 0.000418991 -0.00125992)
    // }
  },
});

export const Actions = style({
  display: "flex",
  gap: "8px",
});

export const ActionIcon = style({
  color: "#b9bbbe",
  cursor: "pointer",
  display: "flex",
  selectors: {
    "&:hover": {
      color: "#dcddde",
    },
  },
});

export const ConversationButton = style({
  border: "1px solid oklab(0.678888 0.00325716 -0.011175 / 0.0392157)",
  borderRadius: "8px",
  width: "100%",
  cursor: "pointer",
  transitionDuration: "0.2s",
  fontFamily:
    '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  height: "32px",
  backgroundColor: "#222225",
  color: "hsl(240 calc(1 * 5.263%) 92.549% /1)",
  ":hover": {
    backgroundColor: "#2c2c30",
  },
  ":active": {
    borderColor: "#313134",
    backgroundColor: "#252529",
  },
  ":disabled": {
    backgroundColor: "hsl(240 calc(1 * 4%) 60.784% /0.12156862745098039)",
  },
});

export const MessagesHeader = style({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  height: "24px",
  color: `color-mix(
    in oklab,
    hsl(233.333 calc(1 * 3.734%) 52.745% /1) 100%,
    #000 0%
  )`,
  fontSize: "14px",
  lineHeight: "14px",
  fontWeight: "500",
  padding: "0px 8px 4px 16px",
  ":hover": {
    color: "oklab(0.988044 0.0000450313 0.0000197887)",
  },
});

export const AddMessageButton = style({
  border: 0,
  backgroundColor: "transparent",
  color: `color-mix(
    in oklab,
    hsl(233.333 calc(1 * 3.734%) 52.745% /1) 100%,
    #000 0%
  )`,
  fontSize: "24px",
  width: "16px",
  cursor: "pointer",
});

export const Scrollable = style({
  overflow: "hidden scroll",
  flex: 1,
  paddingRight: 0,
  backgroundAttachment: "scroll",
  ":hover": {
    overflow: "hidden scroll",
  },
  "::-webkit-scrollbar": {
    width: "8px",
  },
  "::-webkit-scrollbar-thumb": {
    border: "2px solid transparent",
    backgroundClip: "padding-box",
    borderRadius: "4px",
    backgroundColor: "#5f606a",
  },
});

export const FriendData = style({
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  alignItems: "center",
});
