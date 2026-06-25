import { ArrowRight } from "lucide-react";
import AppCard from "../components/AppCard.jsx";
import { apps } from "../data/apps.js";

export default function Home({ onNavigate }) {
  const recentApps = apps.slice(0, 3);
  const featuredApp = apps.find((app) => app.url && !app.url.includes("example.com"));

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">초등 수업용 웹앱 자료실</p>
            <h1>바이브 코딩 놀이터</h1>
            <p className="subtitle">
              초등 수업을 더 재미있고 편리하게 만드는 교과 웹앱 모음
            </p>
            <p className="intro-text">
              직접 만든 수업용 웹앱을 모아두는 공간입니다. 필요한 앱을
              클릭하면 새 창에서 바로 사용할 수 있습니다.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => onNavigate("apps")}
            >
              교과 앱 바로가기 <ArrowRight size={18} />
            </button>
          </div>

          <div className="hero-showcase" aria-label="대표 앱 미리보기">
            {featuredApp?.thumbnail ? (
              <img src={featuredApp.thumbnail} alt="" />
            ) : featuredApp ? (
              <iframe
                src={featuredApp.url}
                title={`${featuredApp.title} 미리보기`}
                loading="lazy"
                tabIndex="-1"
              />
            ) : null}
            <div className="showcase-caption">
              <span>{apps.length}개 수업 앱</span>
              <strong>{featuredApp?.title ?? "교과 웹앱 모음"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">최근 추가</p>
            <h2>최근 추가한 앱</h2>
          </div>
          <div className="card-grid">
            {recentApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
