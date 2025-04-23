"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import globe from "../../../../public/globe.svg";
import * as S from "./styles.css";
import { useChannelStore } from "@/store/channelSlice";
import { useLocalMedia } from "@/app/providers/MediaConfigProvider";

export const MediaConfig = () => {
  // const { data } = useSession();
  const data = null;

  const { activeChannelId } = useChannelStore();
  const {
    localAudioSource,
    muteAudio,
    unmuteAudio,
    mediaState,
    localVideoSource,
    noiseLevel,
    startVolumeDetector,
    stopVolumeDetector,
    startScreenShare,
    stopScreenShare,
  } = useLocalMedia();

  return (
    <div className={S.ConfigContainer}>
      <div className={S.Background}>
        <div className={S.ChannelData}>
          <div className={S.ChannelOptions}>
            <div className={S.ChannelStatus}>
              <span className={S.VoiceStatus}>🖥️ Voice Connected</span>
              <span className={S.ChannelName}>logia-exclusiva</span>
            </div>
            <div className={S.ChannelActions}>
              <span className={S.Option()}>📞</span>
              <span className={S.Option()}>📶</span>
            </div>
          </div>
          {noiseLevel === null ? (
            <button onClick={startVolumeDetector}>start volume detector</button>
          ) : (
            <>
              Noise: {noiseLevel}
              <button onClick={stopVolumeDetector}>stop volume detector</button>
            </>
          )}
          <div className={S.UpperOptions}>
            <span className={S.Option()}>📸</span>
            <span
              onClick={() =>
                !mediaState.screen ? startScreenShare() : stopScreenShare()
              }
              className={S.Option({
                active:
                  activeChannelId && localVideoSource && mediaState.screen
                    ? true
                    : "default",
              })}
            >
              🖥️
            </span>
            <span className={S.Option()}>🖥️</span>
            <span className={S.Option()}>🖥️</span>
          </div>
        </div>
        <div className={S.Separator} />
        <div className={S.MainMedia}>
          <div className={S.UserData}>
            <div className={S.UserImage({ active: Boolean(noiseLevel) })}>
              <Image src={globe} alt="user image" width={40} height={40} />
            </div>
            <div className={S.Name}>
              <span className={S.UserName}>Ignacio</span>
              <span className={S.UserNick}>GoldBomb</span>
            </div>
          </div>
          <div className={S.Options}>
            <span
              onClick={mediaState.mic ? muteAudio : unmuteAudio}
              className={S.Option({
                active: activeChannelId
                  ? Boolean(localAudioSource && mediaState.mic)
                  : "default",
              })}
            >
              🎤
            </span>
            <span className={S.Option()}>🎧</span>
            <span className={S.Option()}>⚙️</span>
          </div>
        </div>
      </div>
    </div>
  );
};
