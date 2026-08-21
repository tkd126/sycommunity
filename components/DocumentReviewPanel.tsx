import { ACHIEVEMENT_LEVELS, type AchievementLevel, type ParsedArea, type ParsedRosterStudent } from "@/types/documents";

type DocumentReviewPanelProps = {
  areas: ParsedArea[];
  roster: ParsedRosterStudent[];
  onLevelChange: (areaId: string, studentNumber: number, level: AchievementLevel) => void;
};

export function DocumentReviewPanel({ areas, roster, onLevelChange }: DocumentReviewPanelProps) {
  const numbers = new Set(roster.map((student) => student.studentNumber));
  return (
    <section className="document-review" aria-labelledby="document-review-title">
      <div className="document-review__heading">
        <div>
          <h3 id="document-review-title">영역별 평가 단계 확인</h3>
          <span className="status-chip status-chip--required">생성 전 확인</span>
        </div>
        <p>파일에서 읽은 단계가 맞는지 확인하고, 미확인 항목은 직접 선택해 주세요.</p>
      </div>

      <div className="document-review__scroll">
        <table>
          <thead>
            <tr>
              <th>영역</th>
              <th>번호</th>
              <th>성명</th>
              <th>원문 단계</th>
              <th>확정 단계</th>
            </tr>
          </thead>
          <tbody>
            {areas.flatMap((area) =>
              area.students.map((student) => (
                <tr key={`${area.areaId}-${student.studentNumber}`}>
                  <td>{area.areaName}</td>
                  <td>{student.studentNumber}</td>
                  <td>{numbers.has(student.studentNumber) ? `${student.studentNumber}번 학생` : "확인 필요"}</td>
                  <td>{student.rawLevel || "확인 필요"}</td>
                  <td>
                    <select
                      className="field"
                      aria-label={`${area.areaName} ${student.studentNumber}번 성취 단계`}
                      value={student.level}
                      onChange={(event) =>
                        onLevelChange(
                          area.areaId,
                          student.studentNumber,
                          event.target.value as AchievementLevel,
                        )
                      }
                    >
                      <option value="">선택</option>
                      {ACHIEVEMENT_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      {areas.flatMap((area) => area.warnings.map((warning) => (
        <p className="document-review__warning" key={`${area.areaId}-${warning}`}>
          {warning}
        </p>
      )))}
    </section>
  );
}
