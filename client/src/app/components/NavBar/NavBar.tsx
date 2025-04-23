"use client";

import Link from "next/link";
import { Links, StyledLink } from "./styles.css";

const links = ["/", "/auth", "/rooms"];

export const NavBar = () => (
  <div className={Links}>
    {links.map((link) => (
      <Link key={link} href={link} className={StyledLink}>
        {link}
      </Link>
    ))}
  </div>
);

// const Links = styled.div`
//   display: flex;
//   flex-direction: row;
//   gap: 10px;
//   position: absolute;
//   z-index: 999;
//   > a {
//     padding: 5px;
//     background-color: #10104b;
//   }
// `;
