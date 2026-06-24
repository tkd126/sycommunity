import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import SubjectApps from "./pages/SubjectApps.jsx";
import About from "./pages/About.jsx";

const pages = {
  home: Home,
  apps: SubjectApps,
  about: About,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const Page = useMemo(() => pages[currentPage] ?? Home, [currentPage]);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <Header currentPage={currentPage} onNavigate={goToPage} />
      <main>
        <Page onNavigate={goToPage} />
      </main>
      <Footer />
    </div>
  );
}
