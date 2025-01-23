import {create} from "zustand";

// Define the Zustand store
const useBooleanStore = create<{
  value: boolean;
  setValue: (newValue: boolean) => void;
}>((set) => ({
  value: false, // Default value
  setValue: (newValue) => set({ value: newValue }),
}));

export default useBooleanStore;
