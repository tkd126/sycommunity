import { ExternalLink } from "lucide-react";

export default function AppCard({ app }) {
  const isReady = Boolean(app.url) && !app.url.includes("example.com");

  return (
    <article className="app-card">
      <a
        className={`card-link ${!isReady ? "disabled" : ""}`}
        href={isReady ? app.url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isReady ? `${app.title} 새 탭에서 열기` : `${app.title} 준비 중`}
        onClick={(event) => {
          if (!isReady) event.preventDefault();
        }}
      >
        <div className="preview-frame" aria-hidden="true">
          <div className="preview-placeholder">
            <span>{app.subject} 수업 웹앱</span>
            <strong>{app.title}</strong>
            <p>초등학생들을 위한 수업용 도구</p>
          </div>
        </div>
        <div className="card-topline">
          <span>{app.subject}</span>
          <span>{app.grade}</span>
        </div>
        <h3>{app.title}</h3>
        <p>{app.description}</p>
        <div className="tag-list" aria-label="태그">
          {app.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <span className={`open-button ${!isReady ? "pending" : ""}`}>
          {isReady ? (
            <>
              앱 열기 <ExternalLink size={16} />
            </>
          ) : (
            "준비 중"
          )}
        </span>
      </a>
    </article>
  );
}
