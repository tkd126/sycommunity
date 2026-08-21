const PRODUCT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/레고/gi, "블록 모형"],
  [/스크래치/gi, "블록형 코딩 도구"],
  [/클레이/gi, "점토"],
  [/로블록스/gi, "가상 창작 공간"],
  [/마인크래프트/gi, "블록형 가상 창작 도구"],
  [/유튜브/gi, "영상 자료"],
  [/비티에스|방탄소년단|뉴진스|아이브|르세라핌|블랙핑크/gi, "대중가요"],
  [/아이돌\s*노래|아이돌/gi, "대중가요"],
  [/경복궁/gi, "건축물"],
];

const COMPLAINT_PRONE_EXPRESSIONS = [
  "친구보다",
  "남들보다",
  "다른 학생보다",
  "가장",
  "최고로",
  "최고의",
  "완벽하게",
  "완벽한",
  "천재적으로",
  "뛰어나게",
  "월등히",
  "압도적으로",
  "부족하게",
  "못하게",
];

export function sanitizeClubActivityText(text: string) {
  let sanitized = text.trim();

  PRODUCT_REPLACEMENTS.forEach(([pattern, replacement]) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  COMPLAINT_PRONE_EXPRESSIONS.forEach((word) => {
    sanitized = sanitized.replaceAll(word, "");
  });

  return sanitized
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasBallSportContext(text: string) {
  return hasAny(text, ["축구", "농구", "배구", "야구", "족구", "피구", "패스", "드리블", "슛", "공 차기", "공놀이"])
    || /(?:^|\s)공(?:을|으로)(?=\s|$)/u.test(text);
}

function participationClause(text: string) {
  if (hasAny(text, ["끈기", "끝까지", "완성"])) {
    return "세부 표현을 끈기 있게 다듬으며";
  }

  if (hasAny(text, ["매 시간", "꾸준", "성실", "열심"])) {
    return "매 시간 성실히 참여하며";
  }

  return null;
}

function oneSentence(value: string) {
  return `${value.replace(/[.!?。,;:…]+/gu, "").trim()}.`;
}

function withGroundedParticipation(text: string, neutral: string, grounded: string) {
  return oneSentence(participationClause(text) ? grounded : neutral);
}

export function generateClubActivityRecord(note: string) {
  const sanitized = sanitizeClubActivityText(note);

  if (!sanitized) {
    return "";
  }

  const participation = participationClause(sanitized);

  if (hasAny(sanitized, ["가상 창작 공간", "블록형 가상 창작 도구"])) {
    return withGroundedParticipation(
      sanitized,
      "가상 창작 공간에서 주제에 맞는 환경과 구성 요소를 배치하여 결과물을 제작하고 공유함",
      `${participation} 가상 창작 공간의 구성 요소를 배치하여 주제에 맞는 결과물을 제작하고 공유함`,
    );
  }

  if (hasAny(sanitized, ["블록 모형", "블록형 구성 도구"]) && hasAny(sanitized, ["건축물", "궁", "건물"])) {
    return withGroundedParticipation(
      sanitized,
      "블록 모형을 활용하여 건축물의 형태와 구조를 살펴 주제에 맞는 결과물을 제작하고 전시함",
      `${participation} 블록 모형으로 건축물의 형태와 구조를 살린 결과물을 제작하고 전시함`,
    );
  }

  if (hasAny(sanitized, ["블록 모형", "블록형 구성 도구"])) {
    return withGroundedParticipation(
      sanitized,
      "블록 모형으로 주제에 맞는 구성물을 설계하고 세부 형태를 조정하여 완성함",
      `${participation} 블록 모형으로 주제에 맞는 구성물을 설계하고 세부 형태를 조정하여 완성함`,
    );
  }

  if (hasAny(sanitized, ["대중가요", "춤", "댄스"])) {
    return withGroundedParticipation(
      sanitized,
      "대중가요의 리듬에 맞추어 춤 동작을 반복해 연습하고 친구들 앞에서 발표함",
      `${participation} 대중가요의 리듬에 맞는 춤 동작을 반복해 연습하고 친구들 앞에서 발표함`,
    );
  }

  if (hasAny(sanitized, ["점토"])) {
    return withGroundedParticipation(
      sanitized,
      "점토의 성질을 살펴 주제에 맞는 형태를 구상하고 세부 모습을 다듬어 작품으로 완성함",
      `${participation} 점토의 성질을 살펴 주제에 맞는 형태를 구상하고 세부 모습을 다듬어 작품으로 완성함`,
    );
  }

  if (hasAny(sanitized, ["블록형 코딩 도구", "코딩", "프로그램"])) {
    return withGroundedParticipation(
      sanitized,
      "블록형 코딩 도구의 명령을 순서대로 구성하고 실행 결과를 확인하여 프로그램을 완성함",
      `${participation} 블록형 코딩 도구의 명령을 순서대로 구성하고 실행 결과를 확인하여 프로그램을 완성함`,
    );
  }

  if (hasAny(sanitized, ["그림", "그리", "색칠", "표현", "작품"])) {
    return withGroundedParticipation(
      sanitized,
      "주제에 어울리는 표현 방법을 구상하고 색과 형태를 다듬어 작품으로 완성함",
      `${participation} 주제에 어울리는 표현 방법을 구상하고 색과 형태를 다듬어 작품으로 완성함`,
    );
  }

  if (hasBallSportContext(sanitized)) {
    return withGroundedParticipation(
      sanitized,
      "공을 다루는 이동 동작과 기본 기술을 반복해 연습하고 모둠 활동에 참여함",
      `${participation} 공을 다루는 이동 동작과 기본 기술을 반복해 연습하고 모둠 활동에 참여함`,
    );
  }

  if (hasAny(sanitized, ["발표", "소개", "설명"])) {
    return withGroundedParticipation(
      sanitized,
      "활동에서 알게 된 내용을 알기 쉽게 정리하여 친구들 앞에서 발표함",
      `${participation} 활동에서 알게 된 내용을 알기 쉽게 정리하여 친구들 앞에서 발표함`,
    );
  }

  const summarized = sanitized
    .replace(/[.!?。]+$/g, "")
    .replace(/(?:했|하였|만들었|그렸|연습했|참여했)다$/g, "")
    .slice(0, 38)
    .trim();
  return withGroundedParticipation(
    sanitized,
    `${summarized} 활동의 순서와 방법을 살펴 계획한 내용을 실제 결과물로 구현함`,
    `${participation} ${summarized} 활동의 순서와 방법을 살펴 계획한 내용을 실제 결과물로 구현함`,
  );
}
