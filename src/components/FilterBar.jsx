export const subjects = [
  "전체",
  "국어",
  "수학",
  "사회",
  "과학",
  "영어",
  "도덕",
  "실과",
  "음악",
  "미술",
  "체육",
  "창체",
];

export const grades = [
  "전체",
  "1학년",
  "2학년",
  "3학년",
  "4학년",
  "5학년",
  "6학년",
  "공통",
];

export default function FilterBar({
  searchTerm,
  subject,
  grade,
  onSearchChange,
  onSubjectChange,
  onGradeChange,
}) {
  return (
    <section className="filter-bar" aria-label="앱 검색과 필터">
      <div className="filter-main-row">
        <label className="search-box">
          <span className="search-icon" aria-hidden="true">
            검색
          </span>
          <span className="sr-only">검색어</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="앱 제목, 설명, 태그 검색"
          />
        </label>

        <label className="grade-select">
          <span>학년</span>
          <select
            value={grade}
            onChange={(event) => onGradeChange(event.target.value)}
          >
            {grades.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="subject-filter" aria-label="과목 선택">
        <span className="filter-label">과목</span>
        <div className="subject-buttons" role="list">
          {subjects.map((item) => (
            <button
              key={item}
              type="button"
              className={subject === item ? "selected" : ""}
              onClick={() => onSubjectChange(item)}
              aria-pressed={subject === item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
