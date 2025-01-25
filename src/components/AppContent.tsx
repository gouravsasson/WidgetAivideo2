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

import Session from "./Session";
// import { Configure } from "./Setup";
import { LineChart, LogOut, Settings } from "lucide-react";
import useSessionStore from "@/store/session";
import useBooleanStore from "@/store/update";
import axios from "axios";
import { useWidgetContext } from "./../constexts/WidgetContext";

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
  const [isEnding, setIsEnding] = useState(false);
  const setSessionId = useSessionStore((state) => state.setSessionId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const { value, setValue } = useBooleanStore();
  const { agent_id, schema ,access_token } = useWidgetContext();

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
    if (!sessionId) {
      console.error("Cannot end session: Missing session ID");
      return;
    }
    setSessionId(null);

    try {
      await axios.post(
        `https://app.snowie.ai/api/end_call_session/`,
        {
          call_session_id: sessionId,
          transcription: "Sample transcription data",
          summary: "Sample session summary",
          schema_name: schema,
        },
        {
          headers: {
            // Authorization: `Bearer ${access_token}`,
          },
        }
      );

      setSessionId(null);
      await voiceClient.disconnect();
    } catch (error) {
      console.error("Failed to end session:", error);
    }
    setValue(!value);
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

  const handleEndSession = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      leave();
    } catch (error) {
      console.error("Failed to end session:", error);
    } finally {
      setIsEnding(false);
    }
  };

  const isReady = appState === "ready";

  return (
    <>
      <div className="  bg-none w-fit">
        <div>
          <Session
            state={transportState}
            onLeave={() => leave()}
            startAudioOff={startAudioOff}
          />
        </div>
        <div className="w-[318px] flex gap-5 justify-center mt-4">
          {appState === "connected" ? (
            <Button
              className="w-full flexitems-center justify-center gap-2"
              onClick={handleEndSession}
              // disabled={state === "error"} // Disable button if there's an error
            >
              {/* {state === "error" && <Loader2 className="animate-spin" />} */}
              <LogOut size={16} />
              <span className="">End Session</span>
            </Button>
          ) : (
            <Button
              className=" flex items-center justify-center gap-2 w-full"
              onClick={start}
              // disabled={!isReady}
            >
              {/* {!isReady && <Loader2 className="animate-spin" />} */}
              {status_text[transportState as keyof typeof status_text]}
            </Button>
          )}
        </div>
        
      </div>
    </>
  );
}
