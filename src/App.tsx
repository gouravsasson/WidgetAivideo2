import { useEffect, useState,useRef } from "react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { LLMHelper, VoiceClient } from "realtime-ai";
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
import axios from "axios";

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
interface UserDetails {
  name: string;
  email: string;
  phone: string;
}
function App() {
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { agent_id, schema } = useWidgetContext();
  console.log(agent_id)
  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  const [botTranscript, setBotTranscript] = useState<string | null>(null);
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  // const [sessionId, setSessionId] = useState<string | null>(null); // Store session ID
  const voiceClientRef = useRef<VoiceClient | null>(null);
  
  // const baseurl = `${window.location.protocol}//${window.location.hostname}`;
  const baseurl = `https://https://2xjx88w4-7777.inc1.devtunnels.ms/`;
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isVoiceAgent, setIsVoiceAgent] = useState(false);
  const [id, Setid] = useState(null);
  const setSessionId = useSessionStore((state) => state.setSessionId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const { value, setValue } = useBooleanStore();
  const [eventTypeId, setEventTypeId] = useState<number>();
  const [agentPhone, setAgentPhone] = useState<string>("");
  const [isAgentDataLoaded, setIsAgentDataLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
   
    console.log(userTranscript);
    console.log("botTranscript",botTranscript);

    const speakExecutionMessage = async (
      functionName: string,
      status: "success" | "error",
      details?: string
    ) => {
      if (!voiceClient) return;
  
      let message = "";
      if (status === "success") {
        switch (functionName) {
          case "collect_user_details":
            message =
              "I've successfully collected and stored your contact information.";
            break;
          case "get_weather_current":
            message = "I've retrieved the current weather information.";
            break;
          case "notify_agency":
            message = "I've sent a notification to the agency with your details.";
            break;
          case "get_first_available_slot":
            message = "I've found the next available appointment slot.";
            break;
          case "book_appointment":
            message =
              "I've successfully booked your appointment and sent you the details.";
            break;
          case "insert_in_ghl":
            message = "I've added your information to our system.";
            break;
          default:
            message = `I've completed the ${functionName} operation successfully.`;
        }
      } else {
        message = `I encountered an issue while ${functionName.replace(/_/g, " ")}. ${details || "Please try again."}`;
      }
  
      try {
        await voiceClient.action({
          service: "tts",
          action: "say",
          arguments: [
            { name: "text", value: message },
            { name: "interrupt", value: false },
          ],
        });
      } catch (error) {
        console.error("Error speaking execution message:", error);
      }
    };

    async function updateCallSession(sessionId: any, data: any) {
      try {
        const response = await axios.patch(
          `${baseurl}/api/callsession/${sessionId}/`,
          data,
          {
            headers: {
              // Authorization: `Bearer ${token}`,
              "schema-name": schema,
            },
          }
        );
        console.log("Updated Call Session:", response.data);
      } catch (error) {
        console.error("Update Call Session Error:", error);
      }
    }

    useEffect(() => {
      const checkAgentType = async () => {
        try {
          const response = await axios.get(
            `${baseurl}/api/get-agent/${agent_id}/`,
            {
              headers: {
                // Authorization: `Bearer ${token}`,
                "schema-name": schema,
              },
            }
          );
          setIsVoiceAgent(response.data.type === "OpenAIVoice");
          setEventTypeId(response.data.cal_event_id);
          setAgentPhone(response.data.agent_phone_number);
          setApiKey(response.data.cal_api_key);
          setIsAgentDataLoaded(true);
          console.log("voice agent", isVoiceAgent);
          console.log("voice agent", response.data.type === "OpenAIVoice");
        } catch (error) {
          console.error("Error checking agent type:", error);
          setIsVoiceAgent(false);
          setIsAgentDataLoaded(true);
        }
      };
  
      if (agent_id) {
        checkAgentType();
      }
    }, [agent_id,
      //  token, 
       schema]);

    useEffect(() => {
      if (!isAgentDataLoaded) return;
      let mounted = true;
      // if (voiceClientRef.current) {
      //   return;
      // }
      const initializeVoiceClient = async () => {
        console.log("getSessionId", sessionId);
        try {
          setIsInitializing(true);
          const sessionResponse = await axios.post(
            `${baseurl}/api/callsession/create/${agent_id}/`,
            {},
            {
              headers: {
                // Authorization: `Bearer ${token}`,
                "schema-name": schema,
              },
            }
          );
  
          const sessionId = sessionResponse.data.response;
          setSessionId(sessionId); // Save session ID for future use
  
          const newVoiceClient = new DailyVoiceClient({
            baseUrl: `${baseurl}/api/daily-bots/voice-openai/connect`,
            services: defaultServices,
            config: defaultConfig,
            timeout: BOT_READY_TIMEOUT,
            enableCam: !isVoiceAgent,
            customBodyParams: {
              agent_code: agent_id,
              schema_name: schema,
              call_session_id: sessionId,
            },
          });
  
          const llmHelper = new LLMHelper({
            callbacks: {
              onLLMFunctionCall: async (fn) => {
                const { function_name: functionName, args } = fn;
                console.log("Function Call Received:", { functionName, args });
  
                try {
                  let result;
                  switch (functionName) {
                    case "collect_user_details": {
                      const { name, email, phone } = args;
                      console.log("Collecting user details:", {
                        name,
                        email,
                        phone,
                      });
  
                      setUserDetails({ name, email, phone });
  
                      if (sessionId) {
                        await updateCallSession(sessionId, {
                          first_name: name.split(" ")[0],
                          last_name: name.split(" ").slice(1).join(" "),
                          email,
                          phone_number: phone,
                          agent: agent_id,
                        });
                      } else {
                        console.error("No active session to update.");
                      }
                      result = { success: true };
                      await speakExecutionMessage(functionName, "success");
                      break;
                    }
  
                    case "get_weather_current": {
                      if (!args.location) {
                        throw new Error("Location not provided");
                      }
                      console.log("Fetching weather for:", args.location);
  
                      const response = await fetch(
                        `api/weather?location=${encodeURIComponent(args.location)}`
                      );
                      const weatherData = await response.json();
                      console.log("Weather data:", weatherData);
                      result = weatherData;
                      await speakExecutionMessage(functionName, "success");
                      break;
                    }
  
                    case "notify_agency": {
                      const details = userDetails || args;
  
                      if (!details.name || !details.email || !details.phone) {
                        throw new Error("User details not available");
                      }
  
                      const message = `
                        New Lead:
                        Name: ${details.name}
                        Email: ${details.email}
                        Phone: ${details.phone}
                      `;
                      const payload = {
                        to: agentPhone,
                        from: "+17755879759",
                        message: message,
                      };
                      console.log("Sending notification:", payload);
  
                      const smsResponse = await fetch(
                        `${baseurl}/api/daily-bots/send-sms`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        }
                      );
  
                      const smsJson = await smsResponse.json();
                      console.log("SMS Response:", smsJson);
                      result = { success: true, smsResponse: smsJson };
                      await speakExecutionMessage(functionName, "success");
                      break;
                    }
  
                    case "get_first_available_slot": {
                      const { appointment_date } = args;
                      const startDate = appointment_date
                        ? new Date(appointment_date)
                        : new Date();
                      const start_time = startDate.toISOString();
  
                      const endDate = new Date(startDate);
                      endDate.setDate(endDate.getDate() + 1);
                      const end_time = endDate.toISOString();
  
                      const slotResponse = await fetch(
                        `https://api.cal.com/v2/slots/available?startTime=${encodeURIComponent(
                          start_time
                        )}&endTime=${encodeURIComponent(end_time)}&eventTypeId=${eventTypeId}`,
                        {
                          headers: {
                            Authorization: `Bearer ${apiKey}`,
                          },
                        }
                      );
  
                      const slotJson = await slotResponse.json();
  
                      if (slotJson.data?.slots) {
                        for (const date in slotJson.data.slots) {
                          const slots = slotJson.data.slots[date];
                          if (slots?.[0]) {
                            result = { success: true, slot: slots[0].time };
                          }
                        }
                      }
                      result = { error: "No slots available" };
                      await speakExecutionMessage(functionName, "success");
                      break;
                    }
  
                    case "book_appointment": {
                      const {
                        user_name,
                        user_email,
                        user_phone,
                        appointment_date,
                      } = args;
  
                      if (
                        !user_name ||
                        !user_email ||
                        !user_phone ||
                        !appointment_date
                      ) {
                        return {
                          error: "Incomplete user details or appointment time",
                        };
                      }
  
                      const bookingData = {
                        start: new Date(appointment_date).toISOString(),
                        eventTypeId: parseInt(eventTypeId),
                        attendee: {
                          name: user_name,
                          email: user_email,
                          phoneNumber: user_phone,
                          timeZone:
                            Intl.DateTimeFormat().resolvedOptions().timeZone,
                          language: "en",
                        },
                        metadata: {},
                      };
  
                      const bookingResponse = await fetch(
                        "https://api.cal.com/v2/bookings",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "cal-api-version": "2024-08-13",
                          },
                          body: JSON.stringify(bookingData),
                        }
                      );
  
                      const bookingJson = await bookingResponse.json();
  
                      if (bookingJson.status === "success") {
                        const appointmentMessage = `
                          New Appointment:
                          Name: ${user_name}
                          Email: ${user_email}
                          Phone: ${user_phone}
                          Appointment Time: ${appointment_date}
                          Meeting link: ${bookingJson.data.meetingUrl}
                        `;
  
                        const notifyResponse = await fetch(
                          `${baseurl}/api/daily-bots/send-sms`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: "+91" + user_phone,
                              from: "+17755879759",
                              message: appointmentMessage,
                            }),
                          }
                        );
  
                        const notifyJson = await notifyResponse.json();
  
                        result = {
                          success: true,
                          appointment: bookingJson,
                          notifyAgencyResponse: notifyJson,
                        };
                      }
  
                      result = { error: "Failed to book the appointment" };
                      await speakExecutionMessage(functionName, "success");
                      break;
                    }
                    case "insert_in_ghl": {
                      const {
                        user_name,
                        user_email,
                        user_phone,
                        appointment_date,
                      } = args;
                      console.log("GHL Integration - User Details:", {
                        name: user_name,
                        email: user_email,
                        phone: user_phone,
                        appointment: appointment_date,
                      });
  
                      if (
                        !user_name ||
                        !user_email ||
                        !user_phone ||
                        !appointment_date
                      ) {
                        console.log("Incomplete appointment details");
                        return {
                          error: "Incomplete user details or appointment time",
                        };
                      }
  
                      const contactData = {
                        schema_name: schema,
                        name: user_name,
                        email: user_email,
                        phone: user_phone,
                        agent_code: agent_id,
                      };
  
                      try {
                        const contactResponse = await axios.post(
                          `${baseurl}/api/create-ghl-contact/`,
                          contactData,
                          {
                            headers: {
                              "Content-Type": "application/json",
                            },
                          }
                        );
  
                        if (contactResponse.status === 201) {
                          const contact_id = contactResponse.data.contactId;
  
                          const appointmentResponse = await axios.post(
                            `${baseurl}/api/agent/leadconnect/appointment/`,
                            {
                              lead_name: user_name,
                              contact_id: contact_id,
                              agent_id: agent_id,
                              appointment_book_ts: appointment_date,
                            },
                            {
                              headers: {
                                "Content-Type": "application/json",
                                "schema-name": schema,
                                // Authorization: `Bearer ${token}`,
                              },
                            }
                          );
  
                          if (appointmentResponse.data.success) {
                            result = {
                              success: true,
                              message:
                                "Contact created and appointment scheduled in GHL",
                              contactId: contact_id,
                            };
                          }
                        }
  
                        result = {
                          error:
                            "Failed to create contact or schedule appointment in GHL",
                        };
                        await speakExecutionMessage(functionName, "success");
                        break;
                      } catch (error) {
                        console.error("GHL Integration Error:", error);
                        return { error: "Failed to integrate with GHL" };
                      }
                    }
                    default:
                      throw new Error(`Unsupported function: ${functionName}`);
                  }
                  return result;
                } catch (error) {
                  console.error(`Error in ${functionName}:`, error);
                  await speakExecutionMessage(functionName, "success");
  
                  return {
                    error:
                      error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
                  };
                }
              },
            },
          });
  
          newVoiceClient.registerHelper("llm", llmHelper);
  
          if (mounted) {
            console.log(mounted);
            setVoiceClient(newVoiceClient);
  
            console.log(voiceClient);
            // await createCallSession(agent_id || "unknown");
            voiceClientRef.current = newVoiceClient;
  
            // Call createCallSession when voice client is ready
  
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
    }, [value, isAgentDataLoaded]);

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