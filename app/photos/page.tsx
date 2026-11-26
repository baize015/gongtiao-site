import type { Metadata } from "next";
import { getAlbums } from "@/lib/albums";
import { PageHeader } from "@/components/ui/Section";
import Lightbox from "./Lightbox";

export const metadata: Metadata = {
  title: "相册",
  description: "走过的地方，和那些没有发生什么的下午。",
};

export default function PhotosPage() {
  // 相册来自 content/albums.json（管理端「相册」页拖照片就写进去了）
  const albums = getAlbums();

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="PHOTOS"
        title="相册"
        description="照片比文字诚实一点。它不会解释，只负责记住当时的雾有多厚。"
      />

      {albums.length === 0 ? (
        <div className="glass rounded-[20px] p-8 text-center">
          <p className="mb-2 font-serif text-lg">相册还是空的</p>
          <p className="text-[0.85rem] text-[var(--ink-soft)]">
            打开「管理端.cmd」→ 相册 → 把照片拖进去，就能出现在这里。
          </p>
        </div>
      ) : null}

      {albums.map((album, index) => (
        <section key={album.id} className={index === 0 ? "" : "mt-16 sm:mt-20"}>
          <div className="mb-6 flex items-start gap-5">
            <img
              src={album.cover}
              alt={`${album.name}的封面`}
              loading="lazy"
              className="h-16 w-24 shrink-0 rounded-xl border border-[var(--line)] object-cover shadow-[var(--shadow)] sm:h-20 sm:w-32"
            />
            <div className="min-w-0">
              <h2 className="flex items-center gap-2.5 font-serif text-[1.35rem]">
                <span className="inline-block h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-[var(--warm)]" />
                {album.name}
              </h2>
              {album.description ? (
                <p className="mt-2 max-w-xl text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">
                  {album.description}
                </p>
              ) : null}
              <p className="mt-1.5 text-[0.72rem] tracking-wide text-[var(--ink-faint)]">
                共 {album.photos.length} 张
              </p>
            </div>
          </div>

          <Lightbox photos={album.photos} albumName={album.name} />
        </section>
      ))}

      <p className="mt-16 text-center text-[0.8rem] text-[var(--ink-faint)]">点开可以放大，Esc 关掉。</p>
    </div>
  );
}
