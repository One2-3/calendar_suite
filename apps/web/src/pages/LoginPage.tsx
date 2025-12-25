// apps/web/src/pages/LoginPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../lib/firebase";
import { tokenStorage } from "../lib/storage";
import { useAuth } from "../auth/useAuth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const AUTH_FIREBASE_EXCHANGE = `${API_BASE}/auth/firebase`;

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";


type TokenPair = { accessToken: string; refreshToken: string };

function normalizeTokenPair(raw: unknown): TokenPair | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const access =
    (typeof r.accessToken === "string" && r.accessToken) ||
    (typeof r.access_token === "string" && r.access_token);
  const refresh =
    (typeof r.refreshToken === "string" && r.refreshToken) ||
    (typeof r.refresh_token === "string" && r.refresh_token);
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

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
    if (DEV_BYPASS) {
      nav("/app", { replace: true });
      return;
    }
    if (status === "authed") nav("/app", { replace: true });
  }, [status, nav]);
  

  const onLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await cred.user.getIdToken();

      // ✅ 서버 JWT 교환 (POST /auth/firebase { idToken })
      const res = await fetch(AUTH_FIREBASE_EXCHANGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as unknown;
      const pair = normalizeTokenPair(json);
      if (!pair) throw new Error("Invalid token response from /auth/firebase");

      // ✅ 프로젝트 tokenStorage에 저장
      tokenStorage.set(pair.accessToken, pair.refreshToken);

      // ✅ 현재 api.ts가 access_token 키를 쓰는 경우도 있어 호환 저장
      try {
        localStorage.setItem("access_token", pair.accessToken);
      } catch {
        // ignore
      }

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

        {/* <button
          type="button"
          onClick={() => {
            console.log("DEV enter clicked");
            tokenStorage.set("dev-access", "dev-refresh");
            // 보호 라우트가 accessToken만 보면 통과하게 만들기
            window.location.href = "/app";
          }}
          style={{ marginTop: 12 }}
        >
          로그인 없이 들어가기(DEV)
        </button> */}

        {error ? <div className="login-err">{error}</div> : null}
      </div>
    </div>
  );

}
