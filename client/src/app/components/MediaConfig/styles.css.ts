import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

export const Background = style({
  backgroundColor: "#202024",
  border: "1px solid #252529",
  width: "100%",
  padding: "8px",
  boxSizing: "border-box",
  borderRadius: "8px",
  height: "fit-content",
  bottom: 0,
});
export const ChannelActions = style({
  display: "flex",
  flexDirection: "row",
  gap: "2px",
});
export const ChannelOptions = style({
  display: "flex",
  flexDirection: "row",
  gap: "2px",
});
export const ChannelStatus = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  flex: 1,
});
export const ChannelName = style({
  fontSize: "13px",
  color: "#9f9fa7",
  selectors: {
    "&:hover": {
      textDecoration: "underline",
    },
  },
});
export const VoiceStatus = style({
  color: "#4eac63",
});

export const ChannelData = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

export const UserName = style({
  fontSize: "14px",
  fontWeight: "bold",
});

export const UserNick = style({
  color: "#8f8f95",
  fontSize: "11px",
  letterSpacing: "0.5px",
});

export const Name = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const Separator = style({
  width: "100%",
  height: "1px",
  backgroundColor: "#252529",
  boxSizing: "border-box",
  marginBlock: "10px",
});

export const MainMedia = style({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
});
export const UserData = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  borderRadius: "20px 8px 8px 20px",
  gap: "8px",
  flex: 1,
  transition: "all 0.15s ease-in-out",
  position: "relative",
  overflow: "hidden",
  cursor: "pointer",
  ":hover": {
    backgroundColor: "#323237",
  },
  selectors: {
    "&::after": {
      content: "",
      backgroundColor: "red",
      height: "12px",
      width: "12px",
      position: "absolute",
      left: "24px",
      bottom: "-4px",
      borderRadius: "50%",
      border: "4px solid #202024",
      transition: "all 0.15s ease-in-out",
    },
    "&:hover::after": {
      borderColor: "#323237",
    },
  },
});
// export const UserImage = style({
//   borderRadius: "50%",
//   width: "40px",
//   height: "40px",
//   overflow: "hidden",
//   "::before": {
//     content: "",
//     position: "absolute",
//     width: "40px",
//     height: "40px",
//     borderRadius: "50%",
//     pointerEvents: "none",
//   },
//   selectors: {
//     [`${UserData}:hover &::before`]: {
//       boxShadow: "inset 0px 0px 0px 2px #3f9f56, inset 0px 0px 0px 3px #323237",
//     },
//   },
// });

export const UserImage = recipe({
  base: {
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    overflow: "hidden",
  },
  variants: {
    active: {
      true: {
        "::before": {
          content: "",
          position: "absolute",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          pointerEvents: "none",
          boxShadow:
            "inset 0px 0px 0px 2px #3f9f56, inset 0px 0px 0px 3px #323237",
        },
      },
    },
  },
});

export const UpperOptions = style({
  display: "flex",
  flexDirection: "row",
  gap: "8px",
});

export const ConfigContainer = style({
  width: "100%",
  height: "fit-content",
  bottom: 0,
  backgroundColor: "oklab(0.183076 0.00112209 -0.00388214)",
  padding: "0px 8px 8px 8px",
});

export const Options = style({
  display: "flex",
  flexDirection: "row",
  gap: "4px",
});

export const Option = recipe({
  base: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    transition: "all 0.15s ease-in-out",
    userSelect: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ":hover": {
      backgroundColor: "#323237",
    },
    selectors: {
      [`${UpperOptions} > &`]: {
        borderWidth: 1,
        borderStyle: "solid",
        width: "25%",
        height: "30px",
        boxSizing: "border-box",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.15s ease-in-out",
      },
    },
  },
  variants: {
    active: {
      default: {
        selectors: {
          [`${UpperOptions} > &`]: {
            backgroundColor: "#2e2e33",
            borderColor: "#323236",
          },
          [`${UpperOptions} > &:hover`]: {
            backgroundColor: "#323237",
            borderColor: "#333338",
          },
        },
      },
      true: {
        backgroundColor: "#212c27",
        ":hover": {
          backgroundColor: "#22372b",
        },
        selectors: {
          [`${UpperOptions} > &`]: {
            borderColor: "#22372a",
          },
          [`${UpperOptions} > &:hover`]: {
            borderColor: "#23412f",
          },
        },
      },
      false: {
        backgroundColor: "#332327",
        borderColor: "#22372a",
        ":hover": {
          backgroundColor: "#45252a",
        },
      },
    },
  },
  defaultVariants: {
    active: "default",
  },
});
