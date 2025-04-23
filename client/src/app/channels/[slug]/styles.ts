import styled from "styled-components";

export const Container = styled.div`
  width: 240px;
  height: 100%;
  background-color: oklab(0.183076 0.00112209 -0.00388214);
  color: #fff;
  display: flex;
  flex-direction: column;
  font-family: "Segoe UI", sans-serif;
  border: 1px solid #222225;
  border-width: 1px 0px 0px 1px;
  border-top-left-radius: 12px;
  overflow: hidden;
  background-attachment: scroll;
  /* ::-webkit-scrollbar {
    background-color: transparent;
  } */
`;

export const Header = styled.div`
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #202225;
  height: 48px;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
`;

export const TabList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  margin-left: 8px;
  gap: 2px;
`;

export const Tab = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 9px 16px 9px 8px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  line-height: 20px;
  color: ${({ $active }) => ($active ? "#fff" : "#b9bbbe")};
  background-color: ${({ $active }) => ($active ? "#27272b" : "transparent")};
  /* ${({ $active }) =>
    $active
      ? `color: #fff; background-color: #393c43`
      : `color: #b9bbbe; background-color: transparent`} */
  //transition: background-color 0.2s ease;
  font-weight: 500;
  &:hover {
    background-color: #1d1d1e;
  }
  &:active {
    background-color: #27272b;
  }
`;

export const Divider = styled.div`
  background-color: #202225;
  border: 0;
  box-shadow: border-box;
  height: 1px;
  margin: 12px 8px;
  width: 100%;
`;

export const FriendsSection = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-left: 8px;
  margin-bottom: 8px;
  gap: 2px;
  display: flex;
  flex-direction: column;
`;

export const FriendItem = styled.div`
  padding: 0px 8px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 500;
  color: oklab(0.671175 0.00174934 -0.010144);
  border-radius: 8px;
  cursor: pointer;
  height: 42px;
  &:hover {
    background-color: #1d1d1e;
  }
  &:active {
    background-color: #27272b;
  }
  &:is(:hover, :active) {
    color: oklab(0.952331 0.000418991 -0.00125992);
    svg {
      color: oklab(0.952331 0.000418991 -0.00125992);
    }
  }
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionIcon = styled.div`
  color: #b9bbbe;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  &:hover {
    color: #dcddde;
  }
`;
