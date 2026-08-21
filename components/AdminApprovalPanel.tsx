"use client";

import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionStatus: "pending" | "active" | "suspended" | "expired";
  protected: boolean;
  createdAt: string;
};

type PatchUser = Partial<Pick<AdminUser, "subscriptionStatus">>;
type AdminUserPatchResponse = Omit<AdminUser, "protected">;

export function mergeAdminUser(current: AdminUser, updated: AdminUserPatchResponse): AdminUser {
  return {
    ...current,
    ...updated,
    protected: current.protected,
  };
}

const statusLabels: Record<AdminUser["subscriptionStatus"], string> = {
  pending: "승인 대기",
  active: "승인됨",
  suspended: "정지",
  expired: "만료",
};

export function AdminApprovalPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "관리자 승인 목록을 불러오지 못했습니다.");
      }

      setUsers(data.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "관리자 승인 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function updateUser(userId: string, patch: PatchUser) {
    setBusyUserId(userId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "사용자 상태를 변경하지 못했습니다.");
      }

      setUsers((current) => current.map((user) => user.id === userId ? mergeAdminUser(user, data.user) : user));
      setMessage("사용자 권한이 저장되었습니다.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "사용자 상태를 변경하지 못했습니다.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            <span>설정</span>
            <i>/</i>
            <b>관리자 승인</b>
          </div>
          <h1>관리자 승인</h1>
          <p>구글 계정으로 가입한 선생님을 확인하고, 승인된 사용자만 교과 평어 기능을 사용할 수 있게 관리합니다.</p>
        </div>
      </div>

      <div className="privacy-notice">
        <b>접근 제한 안내</b>
        <p>이 화면과 관리자 API는 관리자 권한 계정만 사용할 수 있습니다. 학생 평가 파일과 생성 결과는 이 목록에 저장하지 않습니다.</p>
      </div>

      {message ? <div className="notice notice--success" role="status"><span>✓</span>{message}</div> : null}
      {error ? <div className="notice notice--error" role="alert"><span>!</span>{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-panel__toolbar">
          <div>
            <h2>가입자 목록</h2>
            <span>Total {users.length}</span>
          </div>
          <button type="button" className="button-secondary" onClick={loadUsers} disabled={loading}>
            새로고침
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이메일</th>
                <th>이름</th>
                <th>상태</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>가입자 목록을 불러오는 중입니다.</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>아직 가입한 사용자가 없습니다.</td>
                </tr>
              ) : users.map((user) => {
                const busy = busyUserId === user.id;

                return (
                  <tr key={user.id}>
                    <td>{user.email ?? "이메일 없음"}</td>
                    <td>{user.name ?? "-"}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${user.subscriptionStatus}`}>
                        {statusLabels[user.subscriptionStatus]}
                      </span>
                      <span className="sr-only">{user.subscriptionStatus}</span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString("ko-KR")}</td>
                    <td>
                      {user.protected ? <span>보호 계정</span> : null}
                      <div className="admin-actions">
                        <button type="button" className="button-primary" disabled={busy || user.protected || user.subscriptionStatus === "active"} onClick={() => updateUser(user.id, { subscriptionStatus: "active" })}>승인</button>
                        <button type="button" className="button-secondary" disabled={busy || user.protected || user.subscriptionStatus === "suspended"} onClick={() => updateUser(user.id, { subscriptionStatus: "suspended" })}>정지</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
