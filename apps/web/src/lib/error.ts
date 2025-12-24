export type ApiErrorShape = {
    code?: string;
    message?: string;
    details?: unknown;
  };
  
  export function isApiErrorShape(v: unknown): v is ApiErrorShape {
    return !!v && typeof v === "object" && ("message" in v || "code" in v || "details" in v);
  }
  
  export function formatApiError(e: unknown): { title: string; body?: string } {
    // fetch wrapper에서 throw new Error(text) 했을 수도 있고
    // json 에러를 던졌을 수도 있음
    if (e instanceof Error) {
      return { title: e.message || "요청 실패" };
    }
    if (isApiErrorShape(e)) {
      const title = e.message || "요청 실패";
      const code = e.code ? `code: ${e.code}` : "";
      const details = e.details ? `details: ${safeStringify(e.details)}` : "";
      const body = [code, details].filter(Boolean).join("\n");
      return { title, body: body || undefined };
    }
    return { title: "요청 실패", body: safeStringify(e) };
  }
  
  function safeStringify(v: unknown) {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  