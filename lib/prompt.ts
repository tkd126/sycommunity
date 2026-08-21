import { z } from "zod";

const achievementLevelSchema = z.enum(["매우 잘함", "잘함", "보통", "노력 요함"]);

const reportPromptInputSchema = z
  .object({
    subject: z.string().min(1).max(30),
    areaCount: z.number().int().min(1).max(10),
    students: z
      .array(
        z
          .object({
            studentNumber: z.number().int().positive(),
            levels: z
              .array(
                z
                  .object({
                    areaName: z.string().min(1).max(100),
                    level: achievementLevelSchema,
                  })
                  .strict(),
              )
              .max(10),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    evaluationPlan: z.string().max(30_000),
    worksheets: z.string().max(30_000),
    example: z.string().max(10_000),
    instruction: z.string().max(5_000),
  })
  .strict();

export type ReportPromptInput = z.infer<typeof reportPromptInputSchema>;

function compactReferenceText(text: string, subject: string, maxChars = 14_000): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const uniqueLines = [...new Set(lines)];
  const compact = uniqueLines.join("\n");
  if (compact.length <= maxChars) return compact;

  const relevantIndexes = uniqueLines
    .map((line, index) => line.includes(subject) ? index : -1)
    .filter((index) => index >= 0);
  const contextIndexes = new Set<number>();
  for (const index of relevantIndexes) {
    for (let cursor = Math.max(0, index - 6); cursor <= Math.min(uniqueLines.length - 1, index + 6); cursor += 1) {
      contextIndexes.add(cursor);
    }
  }
  const relevant = [...contextIndexes].sort((a, b) => a - b).map((index) => uniqueLines[index]).join("\n");
  if (relevant && relevant.length >= maxChars) return relevant.slice(0, maxChars);

  const remaining = maxChars - relevant.length;
  const headLength = Math.ceil(remaining / 2);
  const tailLength = Math.floor(remaining / 2);
  const boundary = `${compact.slice(0, headLength)}\n${compact.slice(-tailLength)}`;
  return relevant ? `${relevant}\n${boundary}`.slice(0, maxChars) : boundary;
}

export function buildReportPrompt(input: ReportPromptInput): string {
  const parsed = reportPromptInputSchema.parse(input);
  const evaluationPlan = compactReferenceText(parsed.evaluationPlan, parsed.subject);
  const worksheets = compactReferenceText(parsed.worksheets, parsed.subject);
  const studentLines = parsed.students
    .map((student) => {
      const levels = student.levels
        .map(({ areaName, level }) => `${areaName}: ${level}`)
        .join(", ");
      return `학생 번호 ${student.studentNumber} | ${levels}`;
    })
    .join("\n");

  return `너는 한국 초등학교 교사로서 교과별 학기말 종합의견을 작성한다.

[작성 조건]
- 교과는 ${parsed.subject}이며 학생별로 ${parsed.areaCount}개 영역을 반영한다.
- 제공된 영역은 매우 잘함, 잘함, 보통, 노력 요함의 우선순위와 반 전체 균형을 적용해 이미 선택된 최종 근거이므로 모두 반영한다.
- 선택 영역 하나당 정확히 한 문장을 작성하며, 55자에서 100자 정도로 현재보다 구체적으로 쓴다. ${parsed.areaCount}개 영역이면 영역별 평어도 정확히 ${parsed.areaCount}개여야 한다.
- 각 문장에는 평가 자료에서 확인되는 구체적인 학습 대상 또는 개념, 학생이 수행한 활동이나 사고 과정, 설명·비교·적용·해결처럼 확인 가능한 성취 내용을 담는다.
- 분량을 늘리기 위한 반복 표현은 쓰지 않고, 무엇을 어떤 기준이나 근거로 수행했는지가 드러나게 작성한다.
- 기본적인 이해를 보임, 잘 이해함, 잘 설명함, 잘 수행함처럼 대상과 근거가 없는 모호한 표현을 단독으로 사용하지 않는다.
- 기본적인 이해를 보임 대신 기본 개념의 의미와 적용 방법을 이해함처럼 작성한다.
- 특징을 잘 설명함 대신 자료에 나타난 특징을 기준에 따라 비교하고 공통점과 차이점을 명확하게 설명함처럼 작성한다.
- areaComments는 입력에 제시된 영역 순서를 그대로 유지한다.
- 여러 영역의 내용을 한 문장으로 합치지 않는다. 한 영역의 내용을 두 문장 이상으로 나누지도 않는다.
- 보통과 노력 요함도 긍정적인 성장 관점으로 작성한다.
- 미달함, 못함, 부족함, 어려움이 큼, 잘하지 못함을 사용하지 않는다.
- 모범생, 장애우, 그는, 그의, 학생은, 학생의, 어린이를 사용하지 않는다.
- 외국어, 제품명, 상표명, 불필요한 특수문자를 사용하지 않는다.
- 평가 계획과 수행평가지에서 확인할 수 없는 내용을 만들지 않는다.
- 문장 끝맺음과 표현을 자연스럽게 달리하며 학생별 문장이 지나치게 비슷하지 않게 한다.
- 기본 문체는 명사형 종결어미로 작성한다. 문장은 주로 작성함, 이해함, 참여함, 해결함, 보임, 익혀 감, 향상됨처럼 끝낸다.
- 특별한 지시가 없는 한 입니다, 합니다, 했습니다 같은 서술형 종결은 사용하지 않는다.
- 마크다운을 사용하지 않는다. 설명 없이 JSON만 반환한다.

[평가 계획]
${evaluationPlan}

[수행평가지]
${worksheets}

[문체 예시]
${parsed.example}

[추가 지시]
${parsed.instruction}

[익명 학생별 평가 단계]
${studentLines}

[응답 JSON 형식]
{"subject":"${parsed.subject}","warning":"","rows":[{"studentNumber":1,"selectedLevels":"문학 매우 잘함 읽기 잘함 쓰기 보통","areaComments":[{"areaName":"문학","comment":"문학 영역 한 문장."},{"areaName":"읽기","comment":"읽기 영역 한 문장."},{"areaName":"쓰기","comment":"쓰기 영역 한 문장."}]}]}`;
}
