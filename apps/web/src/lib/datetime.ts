// selectedDate(YYYY-MM-DD)를 datetime-local 기본값으로 만들기
export function dateISOToLocalDateTimeStart(dateISO: string) {
    // 00:00
    return `${dateISO}T00:00`;
  }
  export function dateISOToLocalDateTimeEnd(dateISO: string) {
    // 23:59
    return `${dateISO}T23:59`;
  }
  
  // datetime-local -> ISO-like string (서버가 timezone 처리 다를 수 있어 일단 local을 그대로 전송)
  // 필요 시 api.ts에서 변환 정책을 바꾸면 됨.
  export function localDateTimeToSend(v: string) {
    // v: "YYYY-MM-DDTHH:mm"
    return v;
  }
  