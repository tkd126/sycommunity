import { Search } from "lucide-react";

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
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">검색어</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="앱 제목, 설명, 태그 검색"
        />
      </label>

      <label>
        <span>과목</span>
        <select
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
        >
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
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
    </section>
  );
}
