"use client";

import React from "react";
import { FiUserPlus, FiMessageSquare } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import {
  ActionIcon,
  Actions,
  Container,
  Divider,
  FriendItem,
  FriendsSection,
  Header,
  Tab,
  TabList,
} from "./styles";
import styled from "styled-components";
import globe from "../../../../public/globe.svg";
import Image from "next/image";

const mockFriends = [
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
  { name: "Alice" },
  { name: "Bob" },
  { name: "Charlie" },
  { name: "Diana" },
];

const ConversationButton = styled.button`
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

const MessagesHeader = styled.h2`
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

const Scrollable = styled.div`
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

const FriendData = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const FriendList = () => {
  return (
    <Container>
      <Header>
        <ConversationButton>Find or start a conversation</ConversationButton>
      </Header>
      <Scrollable>
        <TabList>
          <Tab $active>📸 Friends</Tab>
          <Tab>📸 Friends</Tab>
          <Tab>📸 Friends</Tab>
        </TabList>
        <Divider />
        <MessagesHeader>
          Direct messages <button>+</button>
        </MessagesHeader>
        <FriendsSection>
          {mockFriends.map((friend, index) => (
            <FriendItem key={index}>
              <FriendData>
                <Image src={globe} alt="globe" height={32} />
                {friend.name}
              </FriendData>
              <Actions>
                <ActionIcon>
                  <RxCross2 />
                </ActionIcon>
              </Actions>
            </FriendItem>
          ))}
        </FriendsSection>
      </Scrollable>
    </Container>
  );
};

export default FriendList;
