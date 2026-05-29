export type InstagramPost = {
  id?: string;
  caption?: string;
  likes_count?: number;
  comments_count?: number;
  likes?: number;
  comments?: number;
  hashtags?: string[];
  mentions?: string[];
  owner_username?: string;
  owner_full_name?: string;
  timestamp?: string;
  url?: string;
};

export type MentionCount = { value: string; count: number };
export type HashtagCount = { value?: string; hashtag?: string; count: number };

export type InstagramAnalysisPayload = {
  username: string;
  generated_at?: string;
  metadata?: { followers?: number; following?: number; full_name?: string; username?: string };
  metrics?: {
    followers?: number;
    following?: number;
    ratio?: number;
    avg_engagement?: number;
    top_hashtags?: { hashtag: string; count: number }[];
  };
  analysis?: {
    avg_likes?: number;
    avg_comments?: number;
    top_hashtags?: HashtagCount[];
    top_mentions?: MentionCount[];
    best_post_by_likes?: InstagramPost;
    best_post_by_comments?: InstagramPost;
    posts?: InstagramPost[];
  };
  posts?: InstagramPost[];
  render_hints?: {
    seed?: string;
    energy?: number;
  };
};

export type PlanetType = "gas_giant" | "ringed" | "rocky";

export type BgStar = { x: number; y: number; r: number; a: number };
export type CloudBlob = {
  x: number;
  y: number;
  vertices: { x: number; y: number }[];
  color: [number, number, number];
  alpha: number;
};

export type StarNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  glow: number;
  color: [number, number, number];
  post: InstagramPost;
  likes: number;
  comments: number;
  isBestLikes: boolean;
  isBestComments: boolean;
  rings: number;
  satellites: { angleOffset: number; radius: number; size: number }[];
  planetType: PlanetType;
  planetColor: [number, number, number];
  accentColor: [number, number, number];
  ringAngle: number;
};

export type Connection = { fromIdx: number; toIdx: number; weight: number; type: "mention" | "proximity" };
export type GridLine = { x1: number; y1: number; x2: number; y2: number };
export type CompassTick = { x1: number; y1: number; x2: number; y2: number };

export type SceneConfig = {
  bgStars: BgStar[];
  cloudBlobs: CloudBlob[];
  stars: StarNode[];
  connections: Connection[];
  technicalGrid: GridLine[];
  compassTicks: CompassTick[];
  catalogNumber: string;
};
