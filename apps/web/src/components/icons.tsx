import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export function IconMenu({ title = "메뉴", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" role="img" aria-label={title} {...props}>
      <path
        fill="currentColor"
        d="M4 6.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0 5.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 4.5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2H5Z"
      />
    </svg>
  );
}

export function IconPencil({ title = "작성", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" role="img" aria-label={title} {...props}>
      <path
        fill="currentColor"
        d="M14.69 3.29a2.5 2.5 0 0 1 3.54 0l2.48 2.48a2.5 2.5 0 0 1 0 3.54l-9.9 9.9a1 1 0 0 1-.47.26l-5.2 1.3a1 1 0 0 1-1.21-1.21l1.3-5.2a1 1 0 0 1 .26-.47l9.9-9.9Zm2.12 1.41-9.64 9.64-.72 2.9 2.9-.72 9.64-9.64-2.18-2.18Z"
      />
    </svg>
  );
}

export function IconSearch({ title = "검색", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" role="img" aria-label={title} {...props}>
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 1 1 4.62 13.42l3.24 3.24a1 1 0 0 1-1.42 1.42l-3.24-3.24A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
      />
    </svg>
  );
}
