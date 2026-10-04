export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="25 80 370 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="The Dog Diary"
    >
      <g
        fill="none"
        stroke="#E8590C"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M207,238 C178,165 125,132 82,150 C40,168 32,228 72,268 C112,306 182,338 236,366 L262,346" />
        <path d="M207,238 C226,152 264,100 300,100 C336,100 354,132 350,168" />
      </g>
      <g fill="#E8590C">
        <path d="M301,246 C330,246 346,290 361,315 C373,338 351,347 330,341 C312,336 290,336 272,341 C250,347 229,337 243,314 C258,289 272,246 301,246 Z" />
        <ellipse cx="240" cy="246" rx="17" ry="22" transform="rotate(-30 240 246)" />
        <ellipse cx="279" cy="204" rx="18" ry="26" transform="rotate(-10 279 204)" />
        <ellipse cx="326" cy="204" rx="18" ry="26" transform="rotate(10 326 204)" />
        <ellipse cx="366" cy="246" rx="17" ry="22" transform="rotate(30 366 246)" />
      </g>
    </svg>
  );
}
