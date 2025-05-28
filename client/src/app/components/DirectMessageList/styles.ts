import styled from "styled-components";

export const Container = styled.div`
  flex: 1;
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
    transition: 0.1s;
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

export const ConversationButton = styled.button`
  border: 1px solid oklab(0.678888 0.00325716 -0.011175 / 0.0392157);
  border-radius: 8px;
  width: 100%;
  cursor: pointer;
  transition-duration: 0.2s;
  font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  height: 32px;
  background-color: #222225;
  color: hsl(240 calc(1 * 5.263%) 92.549% /1);

  &:hover {
    background-color: #2c2c30;
  }
  &:active {
    border-color: #313134;
    background-color: #252529;
  }
  &:disabled {
    background-color: hsl(240 calc(1 * 4%) 60.784% /0.12156862745098039);
  }
`;

export const MessagesHeader = styled.h2`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  color: color-mix(
    in oklab,
    hsl(233.333 calc(1 * 3.734%) 52.745% /1) 100%,
    #000 0%
  );
  font-size: 14px;
  line-height: 14px;
  font-weight: 500;
  padding: 0px 8px 4px 16px;
  &:hover {
    color: oklab(0.988044 0.0000450313 0.0000197887);
  }
  > button {
    border: 0;
    background-color: transparent;
    color: inherit;
    font-size: 24px;
  }
`;

export const Scrollable = styled.div`
  overflow: hidden scroll;
  flex: 1;
  padding-right: 0;
  background-attachment: scroll;
  &:hover {
    overflow: hidden scroll;
  }
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    background-clip: padding-box;
    border-radius: 4px;
    background-color: #5f606a;
  }
`;

export const FriendData = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;
