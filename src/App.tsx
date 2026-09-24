import { ThemeProvider } from "./context/ThemeContext";
import { RevealProvider } from "./context/RevealContext";
import { ReportPage } from "./components/common/ReportPage";

import "./styles/variables.css";
import "./styles/typography.css";
import "./styles/utilities.css";
import "./styles/globals.css";

function App() {
  return (
    <ThemeProvider>
      <RevealProvider>
        <ReportPage />
      </RevealProvider>
    </ThemeProvider>
  );
}

export default App;
