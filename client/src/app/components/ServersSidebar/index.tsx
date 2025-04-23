"use client";

import Image from "next/image";
import globe from "../../../../public/globe.svg";
import { optionImg, separator, ServerListVanilla } from "./styles.css";
import { OptionWrapperProps } from "./styleHelpers";
const amount = [...Array(25)];

const ServersSidebar = () => {
  return (
    <div className={ServerListVanilla}>
      <div className={OptionWrapperProps({ notification: true })}>
        <Image src={globe} alt="option" height={40} className={optionImg} />
      </div>
      <div className={separator} />
      {amount.map((e, i) => (
        <div className={OptionWrapperProps({ active: !!(i % 2) })} key={i}>
          <Image src={globe} alt="option" height={40} className={optionImg} />
        </div>
      ))}
    </div>
  );
};
export default ServersSidebar;
