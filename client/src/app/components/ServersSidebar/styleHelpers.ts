import clsx from "clsx";
import {
  optionAfterActive,
  optionAfterHover,
  optionAfterNotification,
  optionWrapper,
} from "./styles.css";

export const OptionWrapperProps = ({
  active,
  notification,
}: {
  active?: boolean;
  notification?: boolean;
}) =>
  clsx(
    optionWrapper,
    !active && optionAfterHover,
    active && optionAfterActive,
    !active && notification && optionAfterNotification
  );
