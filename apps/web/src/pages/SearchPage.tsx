// apps/web/src/pages/SearchPage.tsx
export default function SearchPage() {
  return (
    <div style={{ padding: "0 18px" }}>
      <div style={{ padding: "10px 0", color: "var(--muted)" }}>Search</div>
      <input className="input" placeholder="검색어를 입력..." />
    </div>
  );
}
