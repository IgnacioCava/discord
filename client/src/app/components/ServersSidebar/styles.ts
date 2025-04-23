import styled, { css } from "styled-components";

export const ServerList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-width: 72px;
  overflow: hidden scroll;
  scrollbar-gutter: stable;
  background-color: oklab(0.183076 0.00112209 -0.00388214);
  padding-bottom: 8px;
  &::-webkit-scrollbar {
    width: 8px;
    background-color: transparent;
  }
`;

export const Separator = styled.div`
  width: 32px;
  margin-inline: 20px auto;
  min-height: 1px;
  background-color: color-mix(
    in oklab,
    hsl(240 calc(1 * 4%) 60.784% /0.12156862745098039) 100%,
    hsl(0 0% 0% /0.12156862745098039) 0%
  );
`;

export const OptionWrapper = styled.div<{
  $active?: boolean;
  $notification?: boolean;
}>`
  display: flex;
  position: relative;
  padding-left: 16px;
  > img {
    background-color: #242222;
    cursor: pointer;
    border-radius: 8px;
  }
  &::after {
    content: "";
    transition: 0.25s;
    width: 0px;
    height: 0%;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    position: absolute;
    border-radius: 0 4px 4px 0;
    background-color: color-mix(
      in oklab,
      hsl(0 calc(1 * 0%) 98.431% /1) 100%,
      #000 0%
    );
    ${({ $active }) =>
      $active &&
      css`
        height: 100%;
        width: 4px;
      `}
    ${({ $notification, $active }) =>
      $notification &&
      !$active &&
      css`
        height: 8px;
        width: 4px;
      `}
  }
  ${({ $active }) =>
    !$active &&
    css`
      &:hover::after {
        content: "";
        height: 50%;
        width: 4px;
      }
    `}
`;
//Replace for tooltip with js logic
/* &::before {
    content: "test";
    width: fit-content;
    height: 10px;
    position: absolute;
    left: 100%;
    z-index: 999;
  } */
