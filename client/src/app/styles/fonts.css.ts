import { globalFontFace } from "@vanilla-extract/css";

const ggSans = "gg sans";

globalFontFace(ggSans, [
  {
    src: 'url(/fonts/ggsansRegular.woff) format("woff")',
    fontWeight: "400",
  },
  {
    src: 'url(/fonts/ggsansMedium.woff) format("woff")',
    fontWeight: "500",
  },
  {
    src: 'url(/fonts/ggsansSemibold.woff) format("woff")',
    fontWeight: "600",
  },
  {
    src: 'url(/fonts/ggsansBold.woff) format("woff")',
    fontWeight: "700",
  },
]);
