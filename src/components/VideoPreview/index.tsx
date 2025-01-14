import React, { useEffect, useRef } from 'react';
import { useVoiceClientMediaTrack } from 'realtime-ai-react';
import styles from './styles.module.css';

const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const track = useVoiceClientMediaTrack("video", "local");

  useEffect(() => {
    if (track && videoRef.current) {
      const stream = new MediaStream([track]);
      videoRef.current.srcObject = stream;
    }
  }, [track]);

  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={styles.video}
        />
        <div className={styles.overlay}>
          <div className={styles.glowRing} />
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;