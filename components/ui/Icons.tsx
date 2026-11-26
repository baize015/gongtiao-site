type IconProps = {
  className?: string;
  size?: number;
};

function base(size = 18, className = "") {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function IconMountain({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 19h18" />
      <path d="M4.5 19 10 8.5l3.4 6.2" />
      <path d="m11.8 19 4.7-9 4 9" />
    </svg>
  );
}

export function IconMoon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconSun({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconMenu({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function IconClose({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconArrowRight({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function IconCalendar({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function IconClock({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconTag({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 13.5 12.5 21a2 2 0 0 1-2.8 0L3 14.3V4h10.3l6.7 6.7a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.8" cy="8.2" r="1.3" />
    </svg>
  );
}

export function IconRss({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" stroke="none" />
      <path d="M4 11a9 9 0 0 1 9 9M4 5a15 15 0 0 1 15 15" />
    </svg>
  );
}

export function IconGithub({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.8a5.3 5.3 0 0 0-1.4-3.7 5 5 0 0 0-.1-3.6s-1.2-.4-3.9 1.5a13 13 0 0 0-7 0C4.1 1.7 3 2.1 3 2.1a5 5 0 0 0-.1 3.6A5.3 5.3 0 0 0 1.5 9.4c0 5.3 3.1 6.5 6.1 6.8a3.4 3.4 0 0 0-.9 2.6V22" />
    </svg>
  );
}

export function IconMail({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function IconBilibili({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="2.5" y="6.5" width="19" height="14" rx="3.5" />
      <path d="m7 3 3 3.5M17 3l-3 3.5M9.5 11.5v3M14.5 11.5v3" />
    </svg>
  );
}

export function IconMusic({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9 18V6.5l10-2V16" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  );
}

export function IconSparkle({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}

export function IconQuote({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9 7c-2.8 0-4.5 2-4.5 4.6 0 2.2 1.4 3.7 3.3 3.7 1.7 0 3-1.2 3-2.9 0-1.6-1.1-2.7-2.6-2.7-.3 0-.6 0-.8.1.3-1 1.2-1.7 2.4-1.9L9 7Z" />
      <path d="M18 7c-2.8 0-4.5 2-4.5 4.6 0 2.2 1.4 3.7 3.3 3.7 1.7 0 3-1.2 3-2.9 0-1.6-1.1-2.7-2.6-2.7-.3 0-.6 0-.8.1.3-1 1.2-1.7 2.4-1.9L18 7Z" />
    </svg>
  );
}

export function IconPaw({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="7" cy="9" r="2" />
      <circle cx="12" cy="6.5" r="2" />
      <circle cx="17" cy="9" r="2" />
      <path d="M12 11c3 0 5.5 2.4 5.5 5 0 1.7-1.3 3-3 3-1 0-1.7-.4-2.5-.4s-1.5.4-2.5.4c-1.7 0-3-1.3-3-3 0-2.6 2.5-5 5.5-5Z" />
    </svg>
  );
}
