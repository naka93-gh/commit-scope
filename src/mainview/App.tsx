import { useState, useEffect } from "react";
import { THEME, THEME_STORAGE_KEY, type Theme } from "../shared/config";
import { WelcomePage } from "./components/Welcome";
import { AnalysisPage } from "./components/Analysis";
import iconUrl from "./assets/icon.svg";

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

  const toggleTheme = () =>
    setTheme((t) => (t === THEME.DARK ? THEME.LIGHT : THEME.DARK));

  const handleAnalyze = (path: string) => {
    setRepoPath(path);
    setCurrentPage("analysis");
  };

  const handleClose = () => {
    setRepoPath("");
    setCurrentPage("welcome");
  };

  return (
    <div className={theme === THEME.DARK ? "dark" : ""}>
      <div className="min-h-screen bg-cs-bg text-cs-text-primary font-sans">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-center mb-6 relative">
            <img src={iconUrl} alt="CommitScope" className="w-9 h-9 mr-2" />
            <h1 className="text-3xl font-bold">CommitScope</h1>
            <button
              onClick={toggleTheme}
              className="absolute right-0 p-2 rounded-lg bg-cs-surface border border-cs-border
                         hover:bg-cs-surface-2 transition-colors text-sm"
              title={
                theme === THEME.DARK
                  ? "ライトモードに切替"
                  : "ダークモードに切替"
              }
            >
              {theme === THEME.DARK ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
          </div>

          {/* ページ切替 */}
          {currentPage === "welcome" ? (
            <WelcomePage onAnalyze={handleAnalyze} />
          ) : (
            <AnalysisPage key={repoPath} repoPath={repoPath} onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
