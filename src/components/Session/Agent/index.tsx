import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { VoiceEvent } from "realtime-ai";
import { 
  // useVoiceClient
  useVoiceClientEvent, useVoiceClientMediaTrack } from "realtime-ai-react";

import ModelBadge from "./model";
import WaveForm from "./waveform";

import styles from "./styles.module.css";
import StatsAggregator from "@/utils/stats_aggregator";

export const Agent: React.FC<{
  isReady: boolean;
  statsAggregator: StatsAggregator;
}> = memo(
  ({ isReady, 
    // statsAggregator 
  }) => {
    // const voiceClient = useVoiceClient()!;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [botStatus, setBotStatus] = useState<
      "initializing" | "connected" | "disconnected"
    >("initializing");
    console.log(botStatus)
    const [botIsTalking, setBotIsTalking] = useState<boolean>(false);
    const [hasVideo, setHasVideo] = useState(false);

    const videoTrack = useVoiceClientMediaTrack("video", "local");

    // Set up video stream
    useEffect(() => {
      const setupVideo = async () => {
        if (videoTrack && videoRef.current) {
          try {
            const stream = new MediaStream([videoTrack]);
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setHasVideo(true);
            console.log('Video stream setup successful');
          } catch (error) {
            console.error('Error setting up video stream:', error);
          }
        }
      };

      setupVideo();

      return () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }, [videoTrack]);

    useEffect(() => {
      if (!isReady) return;
      setHasStarted(true);
      setBotStatus("connected");
    }, [isReady]);

    useVoiceClientEvent(
      VoiceEvent.BotDisconnected,
      useCallback(() => {
        setHasStarted(false);
        setBotStatus("disconnected");
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.BotStartedSpeaking,
      useCallback(() => {
        setBotIsTalking(true);
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.BotStoppedSpeaking,
      useCallback(() => {
        setBotIsTalking(false);
      }, [])
    );

    useEffect(() => () => setHasStarted(false), []);

    const cx = clsx(
      styles.agentWindow,
      hasStarted && styles.ready,
      botIsTalking && styles.talking,
      hasVideo && styles.hasVideo
    );

    return (
      <div className={styles.agent}>
        <div className={cx}>
          <ModelBadge />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
          />
          {!hasStarted ? (
            <span className={styles.loader}>
              <Loader2 size={32} className="animate-spin" />
            </span>
          ) : (
            <WaveForm />
          )}
        </div>
      </div>
    );
  },
  (p, n) => p.isReady === n.isReady
);
Agent.displayName = "Agent";

export default Agent;