"use client";

import Link from "next/link";
import styled from "styled-components";

const links = ["/", "/users", "/auth", "/rooms"];

export const NavBar = () => (
  <Links>
    {links.map((link) => (
      <Link key={link} href={link}>
        {link}
      </Link>
    ))}
  </Links>
);

const Links = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  > a {
    padding: 5px;
    background-color: #10104b;
  }
`;
