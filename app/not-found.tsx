import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="kicker mb-4">404</p>
      <h1 className="font-serif text-[2rem] sm:text-[2.6rem]">雾太浓，这条路没走到</h1>
      <p className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-[var(--ink-soft)]">
        你要找的页面不在这里。可能是地址写错了，也可能是它被雾藏起来了。
      </p>
      <Link href="/" className="btn-ghost mt-8">
        回到山脚
      </Link>
    </div>
  );
}
