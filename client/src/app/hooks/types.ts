interface DefaultVoiceChatProps {
  userId: string;
  socketId: string;
}

export type UserJoinedProps = DefaultVoiceChatProps

export interface AnswerProps extends DefaultVoiceChatProps {
  answer: RTCSessionDescription;
}

export interface OfferProps extends DefaultVoiceChatProps {
  offer: RTCSessionDescription;
}

export interface IceCandidateProps extends DefaultVoiceChatProps {
  candidate: RTCIceCandidate;
}

export type UserLeftProps = DefaultVoiceChatProps

export type CreatePeerConnectionArgs = DefaultVoiceChatProps