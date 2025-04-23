"use client";

import styled from "styled-components";
import * as S from "./styles.css";

const Container = styled.div`
  width: 100%;
  background-color: oklab(0.183076 0.00112209 -0.00388214);
  align-items: center;
  display: flex;
  gap: var(--space-8);
  justify-content: space-between;
  min-height: 36px;
  padding-left: 80px;
  padding-right: 12px;
  position: relative;
  -webkit-app-region: drag;
  grid-area: titleBar;
`;

const Button = styled.button`
  width: 32px;
  height: 32px;
  cursor: pointer;
  align-items: center;
  color: color-mix(
    in oklab,
    hsl(240 calc(1 * 4.294%) 68.039% /1) 100%,
    #000 0%
  );
  display: flex;
  justify-content: center;
  margin: 0;
  background-color: transparent;
  outline: none;
  border: none;
  &:hover {
    color: color-mix(
      in oklab,
      var(--neutral-2) 100%,
      var(--theme-text-color, #000) var(--theme-text-color-amount, 0%)
    );
  }
`;

const ButtonContanier = styled.div`
  justify-content: flex-end;
  align-items: center;
  display: flex;
  gap: 12px;
  position: relative;
  z-index: 1;
  -webkit-app-region: no-drag;
`;

const AppHeader = () => {
  return (
    <div className={S.Container}>
      <div />
      <div>App</div>
      <div className={S.ButtonContanier}>
        <button className={S.Button}>📸</button>
        <button className={S.Button}>📸</button>
      </div>
    </div>
  );
};

export default AppHeader;
