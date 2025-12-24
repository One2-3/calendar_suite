// apps/web/src/pages/AppPage.tsx
import { useAuth } from "../auth/useAuth";

export default function AppPage() {
  const { me, logout } = useAuth();

  return (
    <div style={{ padding: "0 18px" }}>
      <div style={{ padding: "10px 0", color: "var(--muted)" }}>로그인 정보</div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 18, padding: 14 }}>
        <div><b>uid</b>: {me?.id ?? "-"}</div>
        <div><b>email</b>: {me?.email ?? "-"}</div>
        <div><b>role</b>: {me?.role ?? "-"}</div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => void logout()}>로그아웃</button>
        </div>
      </div>
    </div>
  );
}
