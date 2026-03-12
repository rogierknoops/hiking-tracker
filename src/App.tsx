import { useEffect, useState } from "react";
import { useHikeStore } from "./stores/hikeStore";
import { HomeScreen } from "./components/HomeScreen";
import { EditSegmentsScreen } from "./components/EditSegmentsScreen";

export type Screen = "home" | "edit-segments";

function App() {
  const load = useHikeStore((s) => s.load);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    load();
  }, [load]);

  if (screen === "edit-segments") {
    return <EditSegmentsScreen onDone={() => setScreen("home")} />;
  }

  return <HomeScreen onEditSegments={() => setScreen("edit-segments")} />;
}

export default App;
