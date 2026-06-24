import { useMemo, useState } from "react";
import AppCard from "../components/AppCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { apps } from "../data/apps.js";

export default function SubjectApps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("전체");
  const [grade, setGrade] = useState("전체");

  const filteredApps = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return apps.filter((app) => {
      const matchesSearch =
        !keyword ||
        [app.title, app.description, app.subject, app.grade, ...app.tags]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesSubject = subject === "전체" || app.subject === subject;
      const matchesGrade = grade === "전체" || app.grade === grade;

      return matchesSearch && matchesSubject && matchesGrade;
    });
  }, [searchTerm, subject, grade]);

  return (
    <section className="section-block page-section">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">교과 앱</p>
          <h1>수업에 바로 쓰는 웹앱</h1>
          <p>
            검색어와 과목, 학년을 골라 필요한 수업용 앱을 빠르게 찾아보세요.
          </p>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          subject={subject}
          grade={grade}
          onSearchChange={setSearchTerm}
          onSubjectChange={setSubject}
          onGradeChange={setGrade}
        />

        <div className="result-count">총 {filteredApps.length}개 앱</div>

        {filteredApps.length > 0 ? (
          <div className="card-grid">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            조건에 맞는 앱이 없습니다. 검색어 또는 필터를 바꿔보세요.
          </div>
        )}
      </div>
    </section>
  );
}
