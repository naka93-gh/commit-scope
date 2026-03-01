import { useEffect, useState } from "react";
import { THEME, THEME_STORAGE_KEY, type Theme } from "../shared/config";
import iconUrl from "./assets/icon.svg";
import { AnalysisPage } from "./components/Analysis";
import { WelcomePage } from "./components/Welcome";

type Page = "welcome" | "analysis";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEME.LIGHT || stored === THEME.DARK) return stored;
  } catch {}
  return THEME.DARK;
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [currentPage, setCurrentPage] = useState<Page>("welcome");
  const [repoPath, setRepoPath] = useState("");

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === THEME.DARK ? THEME.LIGHT : THEME.DARK));

  const handleAnalyze = (path: string) => {
    setRepoPath(path);
    setCurrentPage("analysis");
  };

  const handleClose = () => {
    setRepoPath("");
    setCurrentPage("welcome");
  };

  const isAnalysis = currentPage === "analysis";

  return (
    <div className={theme === THEME.DARK ? "dark" : ""}>
      <div className="h-screen flex flex-col bg-cs-bg text-cs-text-primary font-sans">
        {/* ヘッダー */}
        <header className="shrink-0 border-b border-cs-border px-4 py-3 flex items-center justify-center relative">
          <img src={iconUrl} alt="CommitScope" className="w-7 h-7 mr-2" />
          <h1 className="text-xl font-bold">CommitScope</h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute right-4 p-1.5 rounded-lg bg-cs-surface border border-cs-border
                       hover:bg-cs-surface-2 transition-colors text-sm"
            title={theme === THEME.DARK ? "ライトモードに切替" : "ダークモードに切替"}
          >
            {theme === THEME.DARK ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
        </header>

        {/* ページ切替 */}
        {isAnalysis ? (
          <AnalysisPage key={repoPath} repoPath={repoPath} onClose={handleClose} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
              <WelcomePage onAnalyze={handleAnalyze} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
