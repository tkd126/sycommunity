"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <section className="auth-panel" aria-live="polite">
        <h1>로그인 상태를 확인하고 있습니다</h1>
        <p>잠시만 기다려 주세요.</p>
      </section>
    );
  }

  if (status !== "authenticated") {
    return (
      <section className="auth-panel">
        <span className="auth-panel__badge">교사 전용</span>
        <h1>구글 계정으로 로그인해 주세요</h1>
        <p>
          학교 선생님들만 사용할 수 있도록 구글 로그인 후 관리자 승인을 받은 계정만
          교과 평어 작성기를 이용할 수 있습니다.
        </p>
        <button className="button-primary" type="button" onClick={() => signIn("google")}>
          구글로 로그인
        </button>
      </section>
    );
  }

  if (user?.subscriptionStatus !== "active") {
    return (
      <section className="auth-panel auth-panel--pending">
        <span className="auth-panel__badge">승인 대기</span>
        <h1>관리자 승인 후 이용할 수 있습니다</h1>
        <p>
          현재 로그인 계정은 <b>{user?.email}</b>입니다. 개인정보 보호를 위해 승인된
          선생님 계정만 평가 파일 분석과 교과 평어 생성을 사용할 수 있습니다.
        </p>
        <div className="auth-panel__actions">
          <button className="button-secondary" type="button" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="auth-strip" aria-label="로그인 사용자">
        <span>{user.email}</span>
        <button type="button" onClick={() => signOut()}>로그아웃</button>
      </div>
      {children}
    </>
  );
}
