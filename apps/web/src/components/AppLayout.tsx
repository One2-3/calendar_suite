// apps/web/src/components/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { CalendarProvider } from "../contexts/CalendarContext";

/**
 * 앱 공통 레이아웃.
 * 전역(상위) 상태: selectedDate / visibleYM / entries 등
 */
export default function AppLayout() {
  return (
    <CalendarProvider>
      <Outlet />
    </CalendarProvider>
  );
}
