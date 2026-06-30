type UsageBadgeProps = {
  amountKrw: number;
  budgetKrw: number;
};

export function UsageBadge({ amountKrw, budgetKrw }: UsageBadgeProps) {
  const status = amountKrw >= budgetKrw ? "limit" : amountKrw >= 27000 ? "warning" : "normal";
  const label = status === "limit" ? "사용 제한" : status === "warning" ? "주의" : null;

  return (
    <div
      className={`usage-badge usage-badge--${status}`}
      data-status={status}
      data-testid="usage-badge"
      aria-label={`이번 달 사용량 ${amountKrw.toLocaleString("ko-KR")}원, 한도 ${budgetKrw.toLocaleString("ko-KR")}원`}
    >
      <div className="usage-badge__title">
        <span>이번 달 사용량</span>
        {label && <strong>{label}</strong>}
      </div>
      <div className="usage-badge__amount">
        <b>{amountKrw.toLocaleString("ko-KR")}원</b>
        <span>/ {budgetKrw.toLocaleString("ko-KR")}원</span>
      </div>
    </div>
  );
}
