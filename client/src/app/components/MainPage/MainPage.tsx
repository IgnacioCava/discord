"use client";

import AppHeader from "../AppHeader/AppHeader";
import FriendList from "../DirectMessageList";
import styled from "styled-components";

const MainContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-areas:
    "titleBar titleBar titleBar"
    "guildsList notice notice"
    "guildsList channelsList page";
  grid-template-columns: [start] min-content [guildsEnd] min-content [channelsEnd] 1fr [end];
  grid-template-rows: [top] 36px [titleBarEnd] min-content [noticeEnd] 1fr [end];
  overflow: hidden;
  flex-grow: 1;
  position: relative;
  border: 0;
  font-family: inherit;
  font-size: 100%;
  font-style: inherit;
  font-weight: inherit;
  margin: 0;
  padding: 0;
  vertical-align: baseline;
`;

const PageContainer = styled.div`
  display: grid;
  grid-column: start / end;
  grid-row: titleBarEnd / end;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  align-items: stretch;
  display: flex;
  flex: 1 1 auto;
  justify-content: flex-start;
  min-height: 0;
  min-width: 0;
`;
const MainPage = () => {
  return (
    <MainContainer>
      <AppHeader />
      <PageContainer>
        <FriendList />
      </PageContainer>
      {/* <MediaConfig /> */}
    </MainContainer>
  );
};

export default MainPage;
