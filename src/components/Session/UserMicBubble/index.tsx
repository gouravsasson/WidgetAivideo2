import React, { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, Mic, MicOff, Pause } from "lucide-react";
import { VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent } from "realtime-ai-react";

import styles from "./styles.module.css";

const AudioIndicatorBubble: React.FC = () => {
  const volRef = useRef<HTMLDivElement>(null);

  useVoiceClientEvent(
    VoiceEvent.LocalAudioLevel,
    useCallback((volume: number) => {
      if (volRef.current) {
        const v = Number(volume) * 1.75;
        volRef.current.style.opacity = Math.max(0.1, v).toString();
      }
    }, [])
  );

  return <div ref={volRef} className={styles.volume} />;
};

interface Props {
  active: boolean;
  muted: boolean;
  handleMute: () => void;
}

export default function UserMicBubble({
  active,
  muted = false,
  handleMute,
}: Props) {
  const canTalk = !muted && active;
  const [botIsSpeaking, setBotIsSpeaking] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = bubble.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      bubble.style.setProperty('--mouse-x', `${x}%`);
      bubble.style.setProperty('--mouse-y', `${y}%`);
    };

    bubble.addEventListener('mousemove', handleMouseMove);
    return () => bubble.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useVoiceClientEvent(
    VoiceEvent.BotStartedSpeaking,
    useCallback(() => setBotIsSpeaking(true), [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => setBotIsSpeaking(false), [])
  );

  const voiceClient = useVoiceClient()!;
  const handleInterrupt = () => {
    voiceClient.action({
      service: "tts",
      action: "interrupt",
      arguments: [],
    });
  };

  const cx = clsx(
    styles.bubble,
    muted && active && styles.muted,
    !active && styles.blocked,
    canTalk && styles.canTalk
  );

  const renderIcon = () => {
    if (!active) return <Loader2 className="w-8 h-8 animate-spin" />;
    if (botIsSpeaking) return <Pause className="w-8 h-8" />;
    if (canTalk) return <Mic className="w-8 h-8" />;
    return <MicOff className="w-8 h-8" />;
  };

  return (
    <div className={styles.bubbleContainer}>
      <div 
        ref={bubbleRef}
        className={cx} 
        onClick={botIsSpeaking ? handleInterrupt : handleMute}
      >
        <div className={styles.icon}>{renderIcon()}</div>
        {canTalk && <AudioIndicatorBubble />}
      </div>
    </div>
  );
}