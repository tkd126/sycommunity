import { describe, expect, it } from "vitest";

import {
  isNaturalCreativeComment,
  sanitizeCreativeComment,
} from "@/lib/creative-activity";

describe("sanitizeCreativeComment natural endings", () => {
  it.each([
    [
      "폭력의 심각성을 이해하고 타인을 존중하는 태도 형성임.",
      "폭력의 심각성을 이해하고 타인을 존중하는 태도를 형성함.",
    ],
    [
      "건강한 생활 습관과 자기관리 능력 향상의 기반을 다지는 활동임.",
      "건강한 생활 습관과 자기관리 능력 향상의 기반을 다지는 활동에 참여함.",
    ],
    [
      "책임감과 협력의 중요성을 깨닫는 성장 과정임.",
      "책임감과 협력의 중요성을 깨닫는 태도를 기름.",
    ],
    [
      "자기 이해와 긍정적 대인 관계 능력 향상을 도모하는 과정임.",
      "자기 이해와 긍정적 대인 관계 능력 향상을 도모함.",
    ],
  ])("형식적인 임 종결을 행동이 완결되는 평어로 고친다", (source, expected) => {
    expect(sanitizeCreativeComment(source)).toBe(expected);
  });

  it.each([
    [
      "시업식에 적극적으로 참여하며 학교 생활의 시작과 중요성을 인식하고 새로운 학기 준비에 대한 자세를 다짐함을 보임.",
      "시업식에 적극적으로 참여하며 학교 생활의 시작과 중요성을 인식하고 새로운 학기 준비에 대한 자세를 다짐함.",
    ],
    [
      "개인위생교육에 참여하여 올바른 위생 관리 방법을 실천하고 건강한 생활 습관을 기름을 보임함을 보임다짐함},{.",
      "개인위생교육에 참여하여 올바른 위생 관리 방법을 실천하고 건강한 생활 습관을 기름.",
    ],
    [
      "상담교육에 성실히 참여하여 자신의 감정과 문제를 이해하고 긍정적인 대처 방법을 익힘을 보임함을 보임함함함함함.",
      "상담교육에 성실히 참여하여 자신의 감정과 문제를 이해하고 긍정적인 대처 방법을 익힘.",
    ],
  ])("중복 종결과 JSON 잔여 문자를 제거해 문법적으로 완결한다", (source, expected) => {
    const result = sanitizeCreativeComment(source);

    expect(result).toBe(expected);
    expect(isNaturalCreativeComment(result)).toBe(true);
  });

  it.each([
    [
      "학교 생활에서 약속을 지키는 태도를 실천함을 다짐함.",
      "학교 생활에서 약속을 지키는 태도를 실천함.",
    ],
    [
      "올바른 생활 습관을 익혀 자기 관리 능력을 기름을 다짐함.",
      "올바른 생활 습관을 익혀 자기 관리 능력을 기름.",
    ],
    [
      "활동의 필요성을 살펴보며 안전에 대한 이해를 높임을 다짐함.",
      "활동의 필요성을 살펴보며 안전에 대한 이해를 높임.",
    ],
    [
      "공동체 생활에서 배려의 중요성을 이해함을 익힘.",
      "공동체 생활에서 배려의 중요성을 이해함.",
    ],
  ])("완성된 명사형 종결 뒤에 덧붙은 다른 종결을 제거한다", (source, expected) => {
    const result = sanitizeCreativeComment(source);

    expect(result).toBe(expected);
    expect(isNaturalCreativeComment(result)).toBe(true);
  });
  it.each([
    "새 학기 준비 자세를 다짐함을 보임.",
    "건강한 생활 습관을 기름을 보임함함.",
    "학교 생활에서 약속을 지키는 태도를 실천함을 다짐함.",
    "올바른 생활 습관을 익혀 자기 관리 능력을 기름을 다짐함.",
    "활동의 필요성을 살펴보며 안전에 대한 이해를 높임을 다짐함.",
    "공동체 생활에서 배려의 중요성을 이해함을 익힘.",
    "책임감을 형성하는 설명임.",
    "활동 내용을 이해함},{.",
  ])("문법적으로 불완전하거나 특수문자가 섞인 평어를 거부한다", (comment) => {
    expect(isNaturalCreativeComment(comment)).toBe(false);
  });

  it.each([
    "시업식에 적극적으로 참여하며 새 학기를 맞이하는 마음가짐을 다지고 학교 생활에 임하는 자세를 다짐함.",
    "활동 내용을 정확하게 이해하고 주어진 문제를 정확하게 해결함.",
    "진로 적성 검사에 성실히 참여하여 자신의 적성과 흥미를 분석하고 미래 진로 계획 수립에 필요한 자기 이해를 익힘.",
  ])("유사한 부사어와 서술어의 중복 또는 잘못된 목적어 호응을 거부한다", (comment) => {
    expect(isNaturalCreativeComment(comment)).toBe(false);
  });
});
