import { useEffect, useState } from "react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { LLMHelper } from "realtime-ai";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";
import { Loader2 } from "lucide-react";
import AppContent from './components/AppContent';
import { CharacterProvider } from './components/context';
import {
  BOT_READY_TIMEOUT,
  defaultConfig,
  defaultServices,
} from './config/rtvi.config';
import { useWidgetContext } from "./constexts/WidgetContext";

const LoadingScreen = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
      <h2 className="text-xl font-medium text-gray-700">
        Initializing AI Teacher...
      </h2>
      <p className="text-sm text-gray-500">
        Setting up your interactive learning experience
      </p>
    </div>
  </div>
);

function App() {
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { agent_id, schema } = useWidgetContext();
  console.log(agent_id)
  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  const [botTranscript, setBotTranscript] = useState<string | null>(null);
   
    console.log(userTranscript);
    console.log("botTranscript",botTranscript);

  useEffect(() => {
    let mounted = true;

    const initializeVoiceClient = async () => {
      try {
        setIsInitializing(true);

        
        const newVoiceClient = new DailyVoiceClient({
          baseUrl: "https://app.snowie.ai/api/daily-bots/voice-openai/connect",
          services: defaultServices,
          config: defaultConfig,
          timeout: BOT_READY_TIMEOUT,
          enableCam: true,
          customBodyParams: {
            agent_code: agent_id,
            schema_name: schema,
          }
          // customBodyParams: {
          //   agent_code: "88bf0c32-5054-42d9-8c04-0ab793f191e7",
          //   schema_name: "5362a575-edb7-4c1e-b267-c0230d7badc0",
          // }
          // mediaConstraints: {
          //   video: {
          //     width: { ideal: 1280 },
          //     height: { ideal: 720 },
          //     facingMode: "user"
          //   },
          //   audio: true
          // }
        });

        const llmHelper = new LLMHelper({
          callbacks: {
            onLLMFunctionCall: () => {
              const audio = new Audio("/shutter.mp3");
              audio.play();
            },
          },
        });

        newVoiceClient.registerHelper("llm", llmHelper);

        newVoiceClient.on("botTranscript", (text) => {
          console.log("Bot Transcript:", text);
          setBotTranscript(text);
        });

        newVoiceClient.on("userTranscript", (transcript) => {
          console.log("User Transcript:", transcript);
          setUserTranscript(transcript.text);
        });

        
        // newVoiceClient.on("transcript", (data) => {
        //   if (data) {
        //     const { text, speaker, final } = data;
  
        //     if (speaker === "user") {
        //       setUserTranscript(text);
        //     } else if (speaker === "bot") {
        //       setBotTranscript(text);
        //     }
  
        //     console.log(`TRANSCRIPT: Speaker: ${speaker}, Final: ${final}, Text: ${text}`);
        //   } else {
        //     console.warn("TRANSCRIPT event received null or undefined data");
        //   }
        // });

        if (mounted) {
          setVoiceClient(newVoiceClient);
          setIsInitializing(false);
        }
      } catch (error) {
        console.error("Failed to initialize voice client:", error);
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeVoiceClient();

    return () => {
      mounted = false;
      if (voiceClient) {
        voiceClient.removeAllListeners();
        setVoiceClient(null);
      }
    };
  }, []);

  if (isInitializing || !voiceClient) {
    return <LoadingScreen />;
  }

  return (
    <VoiceClientProvider voiceClient={voiceClient}>
      <CharacterProvider>
        <TooltipProvider>
          <main>
            <div id="app">
              <AppContent />
            </div>
          </main>
          <aside id="tray" />
        </TooltipProvider>
      </CharacterProvider>
      <VoiceClientAudio />
    </VoiceClientProvider>
  );
}

export default App;