"use client";

import * as S from "./styles.css";
import {
  useFetchFriends,
  useSendFriendRequest,
} from "@/services/queries/users";
import { useState } from "react";
import FriendList from "@/app/components/FriendList";

type FriendListTab = /*"ONLINE" | */ "ACCEPTED" | "PENDING" | "ADD";

const MePage = () => {
  const [tab, setTab] = useState<FriendListTab>("ACCEPTED");
  const { data, refetch, isLoading, isError } = useFetchFriends();
  const sendRequest = useSendFriendRequest();

  const handleSendRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = formData.get("username") as string;

    sendRequest.mutate(username, {
      onSuccess: () => {
        refetch();
        form.reset();
      },
      onError: (error) => {
        console.log(error)
      },
    });
  };

  return (
    <div className={S.MePageContainer}>
      <nav className={S.FriendStatusTabs}>
        <h1 className={S.FriendStatusTitle}>Friends</h1>
        <svg
          className={S.FriendStatusSeparator}
          aria-hidden
          role="img"
          width={4}
          height={4}
          viewBox="0 0 4 4"
        >
          <circle cx="2" cy="2" r="2" fill="currentColor"></circle>
        </svg>
        {/* <button
          onClick={() => setTab("ONLINE")}
          className={S.FriendStatusOption({ active: tab === "ONLINE" })}
        >
          Online
        </button> */}
        <button
          onClick={() => setTab("ACCEPTED")}
          className={S.FriendStatusOption({ active: tab === "ACCEPTED" })}
        >
          All
        </button>
        <button
          onClick={() => setTab("PENDING")}
          className={S.FriendStatusOption({ active: tab === "PENDING" })}
        >
          Pending
        </button>
        <button
          onClick={() => setTab("ADD")}
          className={S.AddFriendOption({
            active: tab === "ADD",
          })}
        >
          Add friend
        </button>
      </nav>
      {tab === "ADD" ? (
        <div>
          <h2>Add friend</h2>
          <span>You can add friends with their Discord username.</span>
          <form onSubmit={handleSendRequest}>
            <input
              placeholder="You can add friends with their Discord username."
              name="username"
            />
            <button type="submit">Send friend request</button>
          </form>
        </div>
      ) : (
        <>
          <div className={S.SearchBarContainer}>
            <div className={S.SearchBar} tabIndex={0}>
              <input className={S.SearchBarInput} placeholder="Search" />
            </div>
          </div>
          <div className={S.FriendList}>
            {isError && <div>Error</div>}
            {isLoading && <div>Loading</div>}
            {data && <FriendList list={data[tab]} status={tab} />}
          </div>
        </>
      )}
    </div>
  );
};

export default MePage;
