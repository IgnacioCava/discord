"use client";

import React from "react";
import { RxCross2 } from "react-icons/rx";
import globe from "../../../../public/globe.svg";
import Image from "next/image";
import * as S from "./styles.css";

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

const FriendList = () => {
  return (
    <div className={S.Container}>
      <div className={S.Header}>
        <button className={S.ConversationButton}>
          Find or start a conversation
        </button>
      </div>
      <div className={S.Scrollable}>
        <div className={S.TabList}>
          <div className={S.Tab({ active: true })}>📸 Friends</div>
          <div className={S.Tab()}>📸 Friends</div>
          <div className={S.Tab()}>📸 Friends</div>
        </div>
        <div className={S.Divider} />
        <h2 className={S.MessagesHeader}>
          Direct messages <button className={S.AddMessageButton}>+</button>
        </h2>
        <div className={S.FriendsSection}>
          {mockFriends.map((friend, index) => (
            <div className={S.FriendItem} key={index}>
              <div className={S.FriendData}>
                <Image src={globe} alt="globe" height={32} />
                {friend.name}
              </div>
              <div className={S.Actions}>
                <div className={S.ActionIcon}>
                  <RxCross2 />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendList;
