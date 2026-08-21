# 구글 로그인 및 승인제 운영 메모

이 앱은 학교 선생님들만 사용할 수 있도록 구글 로그인과 관리자 승인 상태를 함께 확인합니다.

- 처음 구글로 로그인한 사용자는 `subscriptionStatus = pending` 상태로 생성됩니다.
- 관리자 또는 운영자가 DB에서 해당 사용자의 `subscriptionStatus`를 `active`로 바꿔야 사용할 수 있습니다.
- `active`가 아닌 사용자는 문서 분석, 사용량 조회, 평어 생성 API를 호출할 수 없습니다.
- 기존 `TEACHER_ACCESS_PASSWORD`는 아직 유지되어 있어, 승인된 사용자도 평어 생성 시 교사 접근 비밀번호를 한 번 더 입력해야 합니다.

로컬 개발에서 승인하려면 Prisma Studio 또는 pgAdmin에서 `User` 테이블의 대상 이메일을 찾아 `subscriptionStatus` 값을 `active`로 변경합니다.

구글 로그인에 필요한 환경변수 이름은 다음과 같습니다. 실제 값은 `.env.local`에만 입력하고 공개 저장소나 채팅에 올리지 마세요.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
