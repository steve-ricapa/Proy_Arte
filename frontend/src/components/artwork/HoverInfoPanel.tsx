import { StarNode } from "./types/artwork.types";

type HoverInfoPanelProps = {
  star: StarNode | null;
};

export default function HoverInfoPanel({ star }: HoverInfoPanelProps) {
  if (!star) {
    return (
      <div className="w-[320px] flex-shrink-0 rounded-xl border border-white/10 bg-[#050712] p-5 shadow-inner">
        <p className="text-sm text-slate-400 font-mono tracking-wide">
          Hover a planet to inspect its source post
        </p>
        <p className="text-xs text-slate-500 font-mono mt-2">
          (likes, comments, hashtags, caption)
        </p>
      </div>
    );
  }

  const { post } = star;
  const postDate = post.timestamp ? post.timestamp.split("T")[0] : "N/A";
  const pc = star.planetColor;
  const planetColorStyle = `rgb(${pc[0]}, ${pc[1]}, ${pc[2]})`;
  const hTags = (post.hashtags || []).slice(0, 3).map((h) => `#${h}`).join(" ");
  const mMents = (post.mentions || []).slice(0, 2).map((m) => `@${m}`).join(" ");
  const caption = (post.caption || "No caption").replace(/\s+/g, " ").trim();

  return (
    <div className="w-[320px] flex-shrink-0 rounded-xl border border-white/10 bg-[#050712] overflow-hidden shadow-inner">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: planetColorStyle }}
          />
          <span className="text-xs font-mono font-semibold text-amber-200/80 tracking-wider">
            POST ORIGIN
          </span>
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <p className="text-slate-400">
            DATE: <span className="text-white">{postDate}</span>
          </p>
          <p className="text-slate-400">
            LIKES: <span className="text-white">{star.likes}</span>
          </p>
          <p className="text-slate-400">
            COMMENTS: <span className="text-white">{star.comments}</span>
          </p>
          <p className="text-slate-400">
            PLANET: <span className="text-white">{star.planetType.toUpperCase()}</span>
          </p>
        </div>
        <div className="mt-3 space-y-1 font-mono text-xs">
          <p className="text-slate-400">
            HASHTAGS:{" "}
            <span style={{ color: planetColorStyle }}>
              {hTags || "#no-hashtags"}
            </span>
          </p>
          <p className="text-slate-400">
            MENTIONS:{" "}
            <span className="text-blue-300">
              {mMents || "@no-mentions"}
            </span>
          </p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-mono font-semibold text-amber-200/80 tracking-wider mb-2">
          CAPTION
        </p>
        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {caption.length > 200 ? `${caption.slice(0, 200)}...` : caption}
        </p>
      </div>
    </div>
  );
}
