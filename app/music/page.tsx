import type { Metadata } from "next";
import { getMusic, getMusicTracks } from "@/lib/music";
import { PageHeader } from "@/components/ui/Section";
import Playlist from "./Playlist";

export const metadata: Metadata = {
  title: "音乐",
  description: "雾中电台：一些适合在雾里走路的歌。",
};

export default function MusicPage() {
  const music = getMusic();
  const tracks = getMusicTracks();

  return (
    <div className="page-shell pb-24">
      <PageHeader
        kicker="MUSIC"
        title={music.title}
        description="走路时听的东西。没有算法，只有一个人挑的几首。"
      />

      {tracks.length > 0 ? (
        <Playlist tracks={tracks} />
      ) : (
        <div className="glass rounded-[20px] p-8 text-center">
          <p className="mb-2 font-serif text-lg text-[var(--ink)]">电台还没开播</p>
          <p className="text-[0.85rem] leading-relaxed text-[var(--ink-soft)]">
            打开「管理端.cmd」→ 音乐页 → 贴一个网易云歌单链接，点同步就好了。
          </p>
        </div>
      )}

      <p className="mt-10 text-center text-[0.8rem] leading-loose text-[var(--ink-faint)]">
        歌单选好一次就不太会动，偶尔换季的时候会调一调。
        <br className="hidden sm:block" />
        雾散了也会听。
      </p>
    </div>
  );
}
