import { useEffect, useState } from "react";

import LandingPage from "./pages/LandingPage";
import ExperiencePage from "./pages/ExperiencePage";

const EXPERIENCE_ROUTE = "#/experience";

const getCurrentRoute = () => {
  if (typeof window === "undefined") return "landing";
  return window.location.hash === EXPERIENCE_ROUTE ? "experience" : "landing";
};

function App() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getCurrentRoute());
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (route === "experience") {
    return <ExperiencePage onBack={() => { window.location.hash = "#/"; }} />;
  }

  return <LandingPage onEnter={() => { window.location.hash = EXPERIENCE_ROUTE; }} />;
}

export default App;
