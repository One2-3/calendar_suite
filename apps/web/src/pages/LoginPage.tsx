// apps/web/src/pages/LoginPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../lib/firebase";
import { authApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";

function getErrMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "로그인 실패";
}

export default function LoginPage() {
  const nav = useNavigate();
  const { status, refreshMe } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authed") nav("/app", { replace: true });
  }, [status, nav]);

  const onLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();

      // ✅ 서버 JWT 교환 (POST /auth/firebase { idToken })
      await authApi.firebaseExchange(idToken);

      // ✅ accessToken으로 /auth/me 호출해서 UI 갱신
      await refreshMe();

      nav("/app", { replace: true });
    } catch (e) {
      setError(getErrMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Calendar</h1>
        <p>Google 로그인 후 서버 JWT로 교환합니다.</p>
        <button onClick={onLogin} disabled={busy}>
          {busy ? "로그인 중..." : "Google로 로그인"}
        </button>
        {error ? <div className="login-err">{error}</div> : null}
      </div>
    </div>
  );
}
