# 생기부 도우미 별도 배포 및 교실 앱 도구함 연결 설계

## 목표

기존 `sycommunity` 교실 앱 도구함을 유지하면서, 서버 API와 로그인 기능을 사용하는 생기부 도우미를 별도 주소로 배포하고 도구함에서 안전하게 이동할 수 있게 한다.

## 배경 및 제약

- `sycommunity`의 `main` 브랜치는 Vite 기반 교실 앱 도구함이며 기존 앱을 계속 제공한다.
- 생기부 도우미는 Next.js 서버 라우트, PostgreSQL, Google 로그인, OpenAI API 키를 사용한다.
- 두 프로젝트는 공통 이력이 없고 하나의 정적 Vite 배포에 합치면 서버 API와 비밀 환경변수를 안전하게 제공할 수 없다.
- GitHub에는 API 키, DB 비밀번호, OAuth 비밀값을 올리지 않는다.

## 구조

```
sycommunity main (기존 Vite 도구함)
  └─ 생기부 도우미 카드 ── 새 탭 링크 ──▶ 별도 Vercel Next.js 프로젝트
                                                ├─ Google 로그인
                                                ├─ OpenAI Responses API
                                                └─ 클라우드 PostgreSQL
```

## 배포 구성

1. 생기부 도우미는 `codex/student-record-helper-terra` 브랜치를 기준으로 별도 Vercel 프로젝트를 만든다.
2. Vercel 프로젝트의 Production Branch를 해당 브랜치로 설정한다. 기존 `main`은 변경하지 않는다.
3. Vercel 환경변수에만 다음 값을 등록한다.
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL=gpt-5.6-terra`
   - `MONTHLY_BUDGET_KRW`
   - `USD_KRW_RATE`
   - `INPUT_PRICE_PER_1M_USD=2.00`
   - `OUTPUT_PRICE_PER_1M_USD=12.00`
   - `TEACHER_ACCESS_PASSWORD`
   - `DATABASE_URL` (클라우드 PostgreSQL)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (새 Vercel 주소)
   - `ADMIN_EMAIL`
4. Google Cloud OAuth 클라이언트의 승인된 리디렉션 URI에 `https://새주소/api/auth/callback/google`을 추가한다.
5. 새 Vercel 주소가 확인되면 `sycommunity`의 `main`에 생기부 도우미 카드 한 개만 추가한다. 카드는 새 탭에서 별도 서비스를 연다.

## 오류 및 보안 처리

- Vercel 환경변수가 비어 있으면 로그인 또는 생성 API가 안전한 설정 오류를 반환한다.
- 도구함 카드에는 API 키, DB 주소, 관리자 이메일을 표시하지 않는다.
- 별도 서비스가 장애 상태여도 기존 도구함은 정적 Vite 사이트로 계속 동작한다.
- 배포 전 PostgreSQL 스키마 적용과 승인된 관리자 계정 로그인을 확인한다.

## 검증 기준

- 생기부 도우미 Vercel 배포가 HTTPS 주소에서 열리고 Google 로그인이 동작한다.
- 승인된 계정만 파일 분석과 평어 생성 API를 호출할 수 있다.
- 실제 브라우저에서 생성 요청의 월 사용량이 Terra 단가로 계산된다.
- 기존 도구함의 생기부 도우미 카드가 새 주소를 새 탭으로 연다.
- 저장소와 배포 로그에서 API 키, OAuth 비밀값, DB 비밀번호가 발견되지 않는다.
