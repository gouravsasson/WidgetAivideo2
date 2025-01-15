import { useCallback, useEffect, useState } from "react";
import { VoiceError, VoiceEvent, VoiceMessage } from "realtime-ai";
import {
  useVoiceClient,
  useVoiceClientEvent,
  useVoiceClientTransportState,
} from "realtime-ai-react";
import { Loader2 } from "lucide-react";

import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import * as Card from "./ui/card";
import Session from "./Session";
// import { Configure } from "./Setup";
import { LineChart, LogOut, Settings } from "lucide-react";

const status_text = {
  idle: "Initializing...",
  initializing: "Initializing...",
  initialized: "Start",
  authenticating: "Requesting bot...",
  connecting: "Connecting...",
};

export default function AppContent() {
  const voiceClient = useVoiceClient()!;
  const transportState = useVoiceClientTransportState();

  const [appState, setAppState] = useState<
    "idle" | "ready" | "connecting" | "connected"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [startAudioOff, setStartAudioOff] = useState<boolean>(false);

  useVoiceClientEvent(
    VoiceEvent.Error,
    useCallback((message: VoiceMessage) => {
      const errorData = message.data as { error: string; fatal: boolean };
      if (!errorData.fatal) return;
      setError(errorData.error);
    }, [])
  );

  useEffect(() => {
    // Initialize local audio devices
    if (!voiceClient || appState !== "idle") return;
    
    const initDevices = async () => {
      try {
        await voiceClient.initDevices();
      } catch (err) {
        console.error("Failed to initialize devices:", err);
      }
    };

    initDevices();
  }, [appState, voiceClient]);

  useEffect(() => {
    switch (transportState) {
      case "initialized":
        setAppState("ready");
        break;
      case "authenticating":
      case "connecting":
        setAppState("connecting");
        break;
      case "connected":
      case "ready":
        setAppState("connected");
        break;
      default:
        setAppState("idle");
    }
  }, [transportState]);

  async function start() {
    if (!voiceClient) return;

    try {
      voiceClient.enableMic(false);
      await voiceClient.start();
    } catch (e) {
      setError((e as VoiceError).message || "Unknown error occurred");
      voiceClient.disconnect();
    }
  }

  async function leave() {
    await voiceClient.disconnect();
  }

  if (error) {
    return (
      <Alert intent="danger" title="An error occurred">
        {error}
      </Alert>
    );
  }

  // if (appState === "connected") {
  //   return (
  //     <Session
  //       state={transportState}
  //       onLeave={() => leave()}
  //       startAudioOff={startAudioOff}
  //     />
  //   );
  // }

  const isReady = appState === "ready";

  return (
    <Card.Card className=" bg-none">
  
  <Card.CardContent >
    {/* <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        backgroundColor: 'var(--primary-50)',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.375rem',
        fontWeight: '500',
        color: 'var(--pretty)',
      }}
    >
      <Loader2
        style={{
          fontSize: '1.75rem',
          color: 'var(--primary-400)',
        }}
      />
      Works best in a quiet environment with a good internet.
    </div>
    <Configure
      startAudioOff={startAudioOff}
      handleStartAudioOff={() => setStartAudioOff(!startAudioOff)}
      state={appState}
    /> */}
     <Session
        state={transportState}
        onLeave={() => leave()}
        startAudioOff={startAudioOff}
      />
  </Card.CardContent>
  <Card.CardFooter className=" flex gap-5">
    <Button
      key="start"
      fullWidthMobile
      onClick={() => start()}
      disabled={!isReady}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        ...(isReady
          ? {}
          : {
              cursor: 'not-allowed',
              opacity: 0.5,
            }),
      }}
    >
      {!isReady && (
        <Loader2
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {status_text[transportState as keyof typeof status_text]}
    </Button>
    <Button 
            variant="ghost"
            onClick={() => leave()}
            className=" hover:text-white"
          >
            <LogOut size={16} />
            <span className="ml-2">End</span>
          </Button>
  </Card.CardFooter>
</Card.Card>

  );
}