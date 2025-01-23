import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LineChart, LogOut, Settings } from "lucide-react";
import { PipecatMetrics, TransportState, VoiceEvent } from "realtime-ai";
import { useVoiceClient, useVoiceClientEvent } from "realtime-ai-react";

import StatsAggregator from "../../utils/stats_aggregator";
import { Configure } from "../Setup";
import { Button } from "../ui/button";
import * as Card from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import MediaControls from "../MediaControls";
import Stats from "./Stats";

let stats_aggregator: StatsAggregator;

interface SessionProps {
  state: TransportState;
  onLeave: () => void;
  openMic?: boolean;
  startAudioOff?: boolean;
}

export const Session = React.memo(
  ({ state, onLeave, startAudioOff = false }: SessionProps) => {
    const voiceClient = useVoiceClient()!;
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [showDevices, setShowDevices] = useState<boolean>(false);
    const [showStats, setShowStats] = useState<boolean>(false);
    const [muted, setMuted] = useState(startAudioOff);
    const modalRef = useRef<HTMLDialogElement>(null);

    useVoiceClientEvent(
      VoiceEvent.Metrics,
      useCallback((metrics: PipecatMetrics) => {
        metrics?.ttfb?.map((m: { processor: string; value: number }) => {
          stats_aggregator.addStat([m.processor, "ttfb", m.value, Date.now()]);
        });
      }, [])
    );

    useVoiceClientEvent(
      VoiceEvent.BotStoppedSpeaking,
      useCallback(() => {
        if (hasStarted) return;
        setHasStarted(true);
      }, [hasStarted])
    );

    useEffect(() => {
      setHasStarted(false);
    }, []);

    useEffect(() => {
      if (!hasStarted || startAudioOff) return;
      voiceClient.enableMic(true);
    }, [voiceClient, startAudioOff, hasStarted]);

    useEffect(() => {
      stats_aggregator = new StatsAggregator();
    }, []);

    useEffect(() => {
      if (state === "error") {
        onLeave();
      }
    }, [state, onLeave]);

    useEffect(() => {
      const current = modalRef.current;
      if (current && showDevices) {
        current.inert = true;
        current.showModal();
        current.inert = false;
      }
      return () => current?.close();
    }, [showDevices]);

    const toggleMute = useCallback(() => {
      voiceClient.enableMic(muted);
      setMuted(!muted);
    }, [voiceClient, muted]);

    return (
      <>
        <dialog ref={modalRef}>
          <Card.Card className="w-svw max-w-full md:max-w-md lg:max-w-lg">
            <Card.CardHeader>
              <Card.CardTitle>Configuration</Card.CardTitle>
            </Card.CardHeader>
            <Card.CardContent>
              <Configure state={state} inSession={true} />
            </Card.CardContent>
            <Card.CardFooter>
              <Button onClick={() => setShowDevices(false)}>Close</Button>
            </Card.CardFooter>
          </Card.Card>
        </dialog>

        {showStats &&
          createPortal(
            <Stats
              statsAggregator={stats_aggregator}
              handleClose={() => setShowStats(false)}
            />,
            document.getElementById("tray")!
          )}

        <div className="">
          <MediaControls 
            active={hasStarted}
            muted={muted}
            handleMute={toggleMute}
          />
        </div>

        {/* <div className="fixed bottom-4 right-4 flex gap-2 p-3 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10"> */}
          {/* <Tooltip>
            <TooltipContent>Show bot statistics panel</TooltipContent>
            <TooltipTrigger asChild>
              <Button
                variant={showStats ? "light" : "ghost"}
                size="icon"
                onClick={() => setShowStats(!showStats)}
              >
                <LineChart className="text-white/80" />
              </Button>
            </TooltipTrigger>
          </Tooltip> */}
          
          {/* <Tooltip>
            <TooltipContent>Configure</TooltipContent>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDevices(true)}
              >
                <Settings className="text-white/80" />
              </Button>
            </TooltipTrigger>
          </Tooltip> */}

          {/* <div className="w-px h-6 bg-white/10 mx-2" />
          
          <Button 
            variant="ghost"
            onClick={() => onLeave()}
            className="text-white/80 hover:text-white"
          >
            <LogOut size={16} />
            <span className="ml-2">End</span>
          </Button> */}
        {/* </div> */}
      </>
    );
  }
);

Session.displayName = "Session";

export default Session;