---
title: "Server-owned single-administrator authorization"
date: "2026-07-14"
category: "architecture-patterns"
module: "single-administrator-authorization"
problem_type: "architecture_pattern"
component: "authentication"
severity: "high"
applies_when:
  - "A service must have exactly one administrator configured outside application data"
  - "Client session roles are useful for presentation but must not authorize privileged APIs"
  - "Administrative mutation endpoints must protect the owner account"
tags:
  - "admin-email"
  - "server-authorization"
  - "next-auth"
  - "strict-input-schema"
  - "response-allowlist"
  - "owner-protection"
---

# Server-owned single-administrator authorization

## Context

서비스 소유자 한 명만 관리자가 되어야 할 때 데이터베이스의 `role`이나 브라우저 세션의 역할을 최종 권한 근거로 사용하면, 잘못된 데이터 수정이나 남아 있는 역할 변경 API가 다른 계정의 권한 상승 경로가 될 수 있다. 설정 메뉴를 숨기는 것만으로도 직접 API 호출은 막을 수 없다.

이 프로젝트는 관리자 신원을 서버 환경변수 `ADMIN_EMAIL` 하나로 고정하고, 화면 표시와 실제 서버 권한 판정을 분리한다. 관리자 API는 구독 상태만 변경할 수 있게 축소하며, 소유자 계정은 서버와 화면 양쪽에서 보호한다.

## Guidance

### 관리자 신원은 서버 설정 한 곳에서만 정한다

`ADMIN_EMAIL`과 로그인 이메일은 비교 전에 공백을 제거하고 소문자로 정규화한다. 설정이 없거나 이메일 형식이 잘못되면 권한을 부여하지 않는 실패 폐쇄 방식으로 처리한다.

```ts
const adminEmailSchema = z.string().trim().toLowerCase().email();

export function isAdminEmail(email: string | null | undefined, env: NodeJS.ProcessEnv) {
  if (!email) return false;
  const configured = adminEmailSchema.safeParse(env.ADMIN_EMAIL);
  return configured.success && email.trim().toLowerCase() === configured.data;
}
```

`.env.example`에는 `ADMIN_EMAIL=`이라는 이름만 두고 실제 값은 로컬의 `.env.local`이나 배포 서비스의 서버 환경변수에만 저장한다. `NEXT_PUBLIC_` 접두사를 붙이지 않으며, 값 변경 후 서버를 다시 시작한다.

### 세션 역할은 화면 표시용이고 API 권한의 근거가 아니다

NextAuth 세션의 `role`은 설정 메뉴 표시를 위해 서버에서 계산할 수 있다. 그러나 관리자 API는 호출할 때마다 다음 조건을 독립적으로 다시 확인해야 한다.

1. 로그인 세션이 존재함.
2. 구독 상태가 `active`임.
3. 서버의 `ADMIN_EMAIL` 설정이 유효함.
4. 로그인 이메일이 고정 관리자 이메일과 일치함.

```ts
export async function requireAdmin() {
  const active = await requireActiveSubscription();
  return evaluateAdminAccess(active, process.env);
}
```

따라서 데이터베이스에 `role=admin`이 잘못 들어간 계정도 고정 이메일과 다르면 관리자 API를 사용할 수 없다. UI의 메뉴 숨김은 노출과 실수를 줄이는 장치이며 보안 경계는 서버에 있다.

유일 관리자도 데이터베이스의 구독 상태가 먼저 `active`여야 한다. 새 계정의 기본 상태가 `pending`인 구조에서는 최초 운영 전에 관리자 계정을 신뢰할 수 있는 로컬 운영 절차로 한 번 활성화해야 한다. 이 초기화 절차는 일반 사용자 승인 API와 분리하고, 대상 이메일과 변경 시각을 운영 기록에 남긴다.

### 변경 입력과 응답 출력을 모두 허용 목록으로 제한한다

관리자 사용자 변경 API는 구독 상태만 받고 알 수 없는 필드를 거부한다. `.strict()`를 사용하면 `role` 전용 요청뿐 아니라 정상 필드에 `role`을 섞은 요청도 거부된다.

```ts
const updateUserSchema = z.object({
  subscriptionStatus: z.enum(["pending", "active", "suspended", "expired"]),
}).strict();
```

응답은 ORM 객체를 펼치지 않고 허용 필드를 명시한다. TypeScript 타입에서 `role`을 제거해도 런타임 객체를 `{ ...user }`로 반환하면 테스트 대역이나 ORM 결과에 남은 속성이 노출될 수 있다.

### 소유자 계정은 서버와 UI 양쪽에서 보호한다

목록 API는 서버에서 검증한 관리자 ID와 행 ID를 비교해 `protected`를 만든다. PATCH API는 대상이 관리자 본인이면 데이터베이스 변경 전에 `OWNER_ACCOUNT_PROTECTED`로 거부한다. UI도 보호 행의 상태 버튼을 비활성화하지만, 직접 요청을 막는 최종 방어는 서버의 ID 비교다.

이 보호는 현재 관리자 PATCH 경로에 대한 불변조건이다. 직접 데이터베이스 수정, 마이그레이션, 향후 추가되는 다른 관리 경로까지 자동으로 보호하지는 않는다. 그런 작업에서는 고정 관리자 계정을 정지·만료시키지 않는지 별도로 확인하고 감사 가능한 변경 기록을 남겨야 한다.

목록 응답의 `protected`가 PATCH 부분 응답에는 없을 수 있다. 이때 행 전체를 부분 응답으로 교체하지 말고 기존 값과 병합하면서 보호 표식을 보존한다.

```ts
function mergeAdminUser(current: AdminUser, updated: AdminUserPatchResponse) {
  return { ...current, ...updated, protected: current.protected };
}
```

이 병합은 서버 권한 판정을 대체하지 않는다. 화면의 보호 상태가 갱신 뒤 사라지는 회귀를 막는 UI 일관성 규칙이다.

### 관리자 교체와 잠김 복구를 운영 절차로 둔다

`ADMIN_EMAIL` 변경은 단순 설정 수정이 아니라 유일 관리자 교체다. 변경 전에 새 Google 계정이 실제로 로그인 가능한지와 데이터베이스 상태가 `active`인지 확인하고, 서버 환경변수를 변경한 뒤 서버를 재시작한다. 기존 관리자와 새 관리자, 변경 시각과 작업자를 기록한다.

직접 데이터베이스 작업 등으로 유일 관리자가 비활성화된 경우에는 서버 API로 스스로 복구할 수 없다. 배포 전 검증된 제한적 복구 절차를 마련하고, 데이터베이스 접근 권한을 가진 운영자만 대상 이메일과 상태를 확인한 뒤 복구하도록 한다. 복구 후에는 관리자 API 접근, 다른 사용자 거부, 소유자 보호를 다시 점검한다.

### 권한 경계마다 회귀 테스트를 둔다

최소한 다음을 함께 검증한다.

- 관리자 이메일 정규화와 잘못된 설정의 실패 폐쇄
- 고정 관리자 이메일과 일치하는 활성 계정만 통과
- 데이터베이스 역할이 관리자여도 다른 이메일은 거부
- 역할 전용 요청과 역할을 섞은 요청 모두 거부
- 소유자 상태 변경 거부와 데이터베이스 미호출
- 목록·수정 응답에 역할 필드가 없는지 정확 비교
- 일반 사용자와 비활성 관리자에게 설정 메뉴가 보이지 않는지 확인
- PATCH 병합 뒤에도 보호 표시가 유지되는지 확인

## Why This Matters

관리자 권한은 다른 사용자의 승인과 정지를 바꾸는 고위험 기능이다. 서버 전용 신원을 매 요청마다 재검증하면 저장된 역할이나 오래된 화면 상태가 오염되어도 다른 사용자가 관리자가 되지 않는다. 엄격한 입력 스키마와 명시적 출력 허용 목록은 미래의 코드 변경이 역할 상승이나 정보 노출을 다시 만들 가능성도 줄인다.

## When to Apply

- 소유자 한 명만 관리자인 소규모 내부 도구
- Google 로그인 후 소유자가 사용자를 수동 승인하는 서비스
- 과거의 데이터베이스 역할 필드는 남아 있지만 더 이상 신뢰해서는 안 되는 경우
- 현재 관리자 PATCH 경로에서 관리자 자신의 정지나 만료를 차단해야 하는 경우

관리자가 여러 명이거나 위임, 교대, 비상 복구가 필요하면 이 패턴을 그대로 확장하지 않는다. 별도의 관리자 구성 저장소, 감사 기록, 권한 회수 절차를 설계해야 한다.

## Examples

잘못된 패턴은 세션 표시만 신뢰하거나, 알 수 없는 입력을 묵인하거나, ORM 객체를 그대로 반환하는 것이다. 권장 패턴은 모든 관리자 라우트가 `requireAdmin()`을 먼저 실행하고, 엄격한 스키마로 입력을 파싱하며, 응답을 명시적으로 직렬화하는 것이다.

## Related

- `docs/superpowers/specs/2026-07-11-single-admin-security-design.md`
- `docs/superpowers/plans/2026-07-11-single-admin-security.md`
- `docs/solutions/workflow-issues/admin-approval-server-side-authorization.md` — 서버 권한 확인의 선행 기록. 이 문서의 데이터베이스 역할 신뢰 및 역할 변경 설명은 현재 고정 관리자 정책으로 대체되었으므로 그대로 재사용하지 않는다.
- `lib/admin-identity.ts`, `lib/authz.ts`, `lib/auth-options.ts`
- `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`
- `tests/admin-identity.test.ts`, `tests/authz.test.ts`, `tests/api/admin-users.test.ts`
