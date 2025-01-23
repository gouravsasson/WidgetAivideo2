import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Pause } from 'lucide-react';
import { VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent, useVoiceClientMediaTrack } from 'realtime-ai-react';
import styles from './styles.module.css';

interface MediaControlsProps {
  active: boolean;
  muted: boolean;
  handleMute: () => void;
}

const MediaControls: React.FC<MediaControlsProps> = ({ active, muted, handleMute }) => {
  const voiceClient = useVoiceClient()!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [botIsSpeaking, setBotIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoTrack = useVoiceClientMediaTrack("video", "local");

  // Initialize devices early
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        await voiceClient.initDevices();
        setIsInitializing(false);
      } catch (error) {
        console.warn('Device initialization error:', error);
        setIsInitializing(false);
      }
    };

    initializeDevices();
  }, [voiceClient]);

  // Set up video stream
  useEffect(() => {
    let mounted = true;
    
    const setupVideo = async () => {
      if (!videoTrack || !videoRef.current) return;
      
      try {
        const stream = new MediaStream([videoTrack]);
        videoRef.current.srcObject = stream;
        
        if (videoRef.current.readyState >= 2) {
          await videoRef.current.play();
          if (mounted) setIsVideoReady(true);
        } else {
          videoRef.current.onloadedmetadata = async () => {
            await videoRef.current?.play();
            if (mounted) setIsVideoReady(true);
          };
        }
      } catch (error) {
        console.warn('Video playback error:', error);
      }
    };

    setupVideo();

    return () => {
      mounted = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        setIsVideoReady(false);
      }
    };
  }, [videoTrack]);

  useVoiceClientEvent(
    VoiceEvent.BotStartedSpeaking,
    useCallback(() => setBotIsSpeaking(true), [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => setBotIsSpeaking(false), [])
  );

  useVoiceClientEvent(
    VoiceEvent.LocalAudioLevel,
    useCallback((volume: number) => {
      setIsUserSpeaking(volume > 0.1);
    }, [])
  );

  const handleInterrupt = useCallback(() => {
    voiceClient.action({
      service: "tts",
      action: "interrupt",
      arguments: [],
    });
  }, [voiceClient]);

  const handleMicToggle = useCallback(() => {
    if (botIsSpeaking) {
      handleInterrupt();
    } else {
      handleMute();
    }
  }, [botIsSpeaking, handleInterrupt, handleMute]);

  const renderIcon = () => {
    if (isInitializing) return <Loader2 className="animate-spin" />;
    if (!active) return <Loader2 className="animate-spin" />;
    if (botIsSpeaking) return <Pause />;
    return muted ? <MicOff /> : <Mic />;
  };

  return (
    <div className="h-[318px] w-[318px]">
      <div className={`${styles.mediaWrapper} ${isUserSpeaking ? styles.speaking : ''}`}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`${styles.video} ${isVideoReady ? styles.ready : ''}`}
        />
        <div className={styles.overlay}>
          <div className={styles.glassPane} />
          <button 
            className={`${styles.micButton} ${isInitializing ? styles.initializing : ''}`}
            onClick={handleMicToggle}
            disabled={!active || isInitializing}
          >
            {renderIcon()}
            <div className={styles.buttonGlow} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaControls;