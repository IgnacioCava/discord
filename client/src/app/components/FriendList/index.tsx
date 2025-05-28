import {
  useAnswerFriendRequest,
  useCancelFriendRequest,
  type Friends,
} from "@/services/queries/users";
import { MouseEvent, useEffect, useState } from "react";
import GlobeImage from "../GlobeImage";
import * as S from "./styles.css";

const List = ({
  list,
  type,
}: {
  list: Friends;
  type?: "sent" | "received";
}) => {
  const cancelRequest = useCancelFriendRequest();
  const answerRequest = useAnswerFriendRequest();
  const handleCancelRequest = (
    event: MouseEvent<HTMLButtonElement>,
    receiverId: string
  ) => {
    event.preventDefault();
    cancelRequest.mutate(receiverId);
  };
  const handleAnswerRequest = (
    event: MouseEvent<HTMLButtonElement>,
    answer: { senderId: string; accepted: boolean }
  ) => {
    event.preventDefault();
    console.log(answer.senderId)
    answerRequest.mutate(answer);
  };
  return (
    <>
      {list?.map((e) => (
        <div key={e.id} className={S.FriendListItem}>
          <div className={S.FLIUserData}>
            <GlobeImage alt="some" height={32} />
            <div className={S.FLIContainer}>
              <span className={S.FLIUsername}>Username</span>
              <span className={S.FLIUserStatus}>Status</span>
            </div>
          </div>
          {type === "sent" ? (
            <div className={S.FLIActions}>
              <button
                onClick={(event) => handleCancelRequest(event, e.id)}
                className={S.FLIAction}
              >
                cancel
              </button>
            </div>
          ) : type === "received" ? (
            <div className={S.FLIActions}>
              <button
                onClick={(event) =>
                  handleAnswerRequest(event, {
                    accepted: true,
                    senderId: e.id,
                  })
                }
                className={S.FLIAction}
              >
                Accept
              </button>
              <button
                onClick={(event) =>
                  handleAnswerRequest(event, {
                    accepted: false,
                    senderId: e.id,
                  })
                }
                className={S.FLIAction}
              >
                Ignore
              </button>
            </div>
          ) : (
            <div className={S.FLIActions}>
              <button className={S.FLIAction}>Message</button>
              <button className={S.FLIAction}>More</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

const FriendList = ({
  list,
  status,
}: {
  list: Friends;
  status: /*"ONLINE" | */ "ACCEPTED" | "PENDING";
}) => {
  const [pendingList, setPendingList] = useState<{
    received: Friends;
    sent: Friends;
  } | null>(null);
  useEffect(() => {
    if (status !== "PENDING" || !list) return;
    const receivedRequestsList = list.filter((f) => !f.isSender);
    const sentRequestList = list.filter((f) => f.isSender);
    setPendingList({ received: receivedRequestsList, sent: sentRequestList });
  }, [list, status]);

  if (!list?.length) return null;
  return (
    <>
      {status === "ACCEPTED" ? (
        <>
          <div className={S.ListTitle}>All friends — {list?.length}</div>
          <List list={list} />
        </>
      ) : (
        <>
          {pendingList?.received?.length ? (
            <>
              <div className={S.ListTitle}>
                Received — {pendingList?.received?.length}
              </div>
              <List list={pendingList?.received} type="received" />
            </>
          ) : null}
          {pendingList?.sent?.length ? (
            <>
              <div className={S.ListTitle}>
                Sent — {pendingList?.sent?.length}
              </div>
              <List list={pendingList?.sent} type="sent" />
            </>
          ) : null}
        </>
      )}
    </>
  );
};

export default FriendList;
