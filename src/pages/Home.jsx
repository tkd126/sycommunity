import { useRef } from "react";
import AppCard from "../components/AppCard.jsx";
import VariableProximity from "../components/VariableProximity.jsx";
import { apps } from "../data/apps.js";

export default function Home({ onNavigate }) {
  const recentApps = apps.slice(0, 3);
  const titleRef = useRef(null);
  const buttonRef = useRef(null);

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy" ref={titleRef}>
            <p className="eyebrow">초등 수업용 웹앱 자료실</p>
            <h1>
              <VariableProximity
                label="초등수업 웹앱 자료실"
                className="variable-proximity-title"
                fromFontVariationSettings="'wght' 650, 'opsz' 14"
                toFontVariationSettings="'wght' 1000, 'opsz' 42"
                containerRef={titleRef}
                radius={120}
                falloff="linear"
              />
            </h1>
            <p className="subtitle">
              초등 수업을 더 재미있고 편리하게 만드는 교과 웹앱 모음
            </p>
            <p className="intro-text">
              직접 만든 수업용 웹앱을 모아두는 공간입니다. 필요한 앱을 클릭하면 새 창에서 바로 <span className="nowrap">사용할 수 있습니다.</span>
            </p>
            <button
              ref={buttonRef}
              className="primary-button"
              type="button"
              onClick={() => onNavigate("apps")}
            >
              <VariableProximity
                label="교과 앱 바로가기"
                className="variable-proximity-button"
                fromFontVariationSettings="'wght' 750, 'opsz' 12"
                toFontVariationSettings="'wght' 1000, 'opsz' 34"
                containerRef={buttonRef}
                radius={78}
                falloff="linear"
              />
              <span className="button-arrow" aria-hidden="true">
                →
              </span>
            </button>
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
