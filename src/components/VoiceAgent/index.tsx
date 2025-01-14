import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { VoiceEvent } from "realtime-ai";
import { useVoiceClientMediaTrack, useVoiceClientEvent } from 'realtime-ai-react';
import styles from './styles.module.css';

interface VoiceAgentProps {
  active: boolean;
  muted: boolean;
  handleMute: () => void;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ active, muted, handleMute }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const track = useVoiceClientMediaTrack("audio", "bot");
  const canTalk = !muted && active;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Bot speaking detection
  useVoiceClientEvent(
    VoiceEvent.BotStartedSpeaking,
    useCallback(() => setIsSpeaking(true), [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => setIsSpeaking(false), [])
  );

  // User speaking detection
  useVoiceClientEvent(
    VoiceEvent.LocalAudioLevel,
    useCallback((volume: number) => {
      setIsUserSpeaking(volume > 0.1);
    }, [])
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
  
    // Create particles
    const particles = Array.from({ length: 15 }, (_, i) => {
      const particle = document.createElement('div');
      particle.className = styles.particle;
      particle.style.setProperty('--x', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--y', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--z', (Math.random() * 2 - 1).toString());
      particle.style.setProperty('--i', i.toString());
      return particle;
    });
  
    const particlesContainer = container.querySelector(`.${styles.particles}`);
    particles.forEach(p => particlesContainer?.appendChild(p));
  
    // Audio visualization
    if (track) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
  
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const waves = Array.from({ length: 3 }, (_, i) => {
        const wave = document.createElement('div');
        wave.className = styles.wave;
        wave.style.transform = `rotateX(${60 + i * 30}deg)`;
        return wave;
      });
  
      const waveform = container.querySelector(`.${styles.waveform}`);
      waves.forEach(w => waveform?.appendChild(w));
  
      const updateWaves = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const scale = 1 + (average / 255) * 0.3;
  
        waves.forEach((wave, i) => {
          wave.style.transform = `
            rotateX(${60 + i * 30}deg) 
            scale(${scale - i * 0.1})
          `;
          wave.style.borderWidth = `${2 + (average / 255) * 3}px`;
          wave.style.borderTopColor = `rgba(255, 255, 255, ${0.2 + (average / 255) * 0.4})`;
        });
  
        requestAnimationFrame(updateWaves);
      };
  
      updateWaves();
  
      // Cleanup function
      return () => {
        source.disconnect(); // Disconnect source from analyser
        analyser.disconnect(); // Disconnect analyser from context
        audioContext.close().catch(console.error); // Close the audio context
      };
    }
  }, [track]);
  

  const renderIcon = () => {
    if (!active) return <Loader2 className="animate-spin" />;
    return canTalk ? <Mic /> : <MicOff />;
  };

  return (
    <div 
      ref={containerRef} 
      className={`${styles.container} ${isSpeaking ? styles.speaking : ''} ${isUserSpeaking ? styles.userSpeaking : ''}`} 
      onClick={handleMute}
    >
      <div className={styles.sphere}>
        <div className={styles.core} />
        <div className={styles.rings} />
        <div className={styles.particles} />
        <div className={styles.waveform} />
        <div className={styles.icon}>{renderIcon()}</div>
      </div>
    </div>
  );
};

export default VoiceAgent;