import type { ReelData } from 'react-native-flash-reels';

export interface MockReel extends ReelData {
  username: string;
  caption: string;
  likes: number;
  comments: number;
}

/**
 * Portrait ~1080x1920 Pexels clips for the demo (verified reachable).
 * Avoid 4K / UHD sources — they often fail to decode or stay black on mid-range
 * Android devices. `duration` is seconds (ffprobe) for a responsive progress bar.
 */
const PEXELS_CLIPS: ReadonlyArray<{ uri: string; duration: number }> = [
  {
    uri: 'https://videos.pexels.com/video-files/18089052/18089052-hd_1080_1920_30fps.mp4',
    duration: 52.308,
  },
  {
    uri: 'https://videos.pexels.com/video-files/39000485/16594554_1080_1920_30fps.mp4',
    duration: 6.9,
  },
  {
    uri: 'https://videos.pexels.com/video-files/13600150/13600150-hd_1080_1920_30fps.mp4',
    duration: 20.153,
  },
  {
    uri: 'https://videos.pexels.com/video-files/35132819/14883418_1080_1920_30fps.mp4',
    duration: 22.0,
  },
  {
    uri: 'https://videos.pexels.com/video-files/30098016/12908063_1080_1920_30fps.mp4',
    duration: 23.0,
  },
  {
    uri: 'https://videos.pexels.com/video-files/35475885/15029369_1440_2560_25fps.mp4',
    duration: 33.0,
  },
];

const META: Array<Omit<MockReel, 'id' | 'videoUri' | 'duration'>> = [
  {
    username: 'golden.hour',
    caption: 'Soft light, no filter.',
    likes: 12840,
    comments: 312,
  },
  {
    username: 'city.pulse',
    caption: 'Walked until the noise felt like music.',
    likes: 9021,
    comments: 188,
  },
  {
    username: 'quiet.frame',
    caption: 'One take. Kept the shake.',
    likes: 15402,
    comments: 401,
  },
  {
    username: 'night.shift',
    caption: 'Neon does half the work.',
    likes: 22119,
    comments: 544,
  },
  {
    username: 'slow.pour',
    caption: 'Coffee first. Then the scroll.',
    likes: 7760,
    comments: 97,
  },
  {
    username: 'open.road',
    caption: 'Windows down, playlist up.',
    likes: 18933,
    comments: 276,
  },
  {
    username: 'market.day',
    caption: 'Third stall from the left — trust me.',
    likes: 11028,
    comments: 203,
  },
  {
    username: 'blue.hour',
    caption: 'Sky did the color grade.',
    likes: 13455,
    comments: 251,
  },
  {
    username: 'hand.held',
    caption: 'No gimbal. Still works.',
    likes: 8450,
    comments: 142,
  },
  {
    username: 'peak.hour',
    caption: 'Crowds move like water.',
    likes: 16440,
    comments: 335,
  },
  {
    username: 'soft.focus',
    caption: 'Blur on purpose this time.',
    likes: 8733,
    comments: 149,
  },
  {
    username: 'late.train',
    caption: 'Platform lights and half a playlist.',
    likes: 12190,
    comments: 224,
  },
  {
    username: 'open.field',
    caption: 'Wind in the mic. Worth it.',
    likes: 14776,
    comments: 268,
  },
  {
    username: 'final.cut',
    caption: 'End of the feed — scroll again?',
    likes: 25501,
    comments: 601,
  },
  {
    username: 'first.light',
    caption: 'Alarm off. Lens on.',
    likes: 9988,
    comments: 167,
  },
];

/**
 * Demo reels cycling portrait Pexels clips.
 * Stable CDN URIs for local testing — not for production CDN use.
 */
export const mockReels: MockReel[] = META.map((meta, index) => {
  const clip = PEXELS_CLIPS[index % PEXELS_CLIPS.length]!;
  return {
    id: String(index + 1),
    videoUri: clip.uri,
    duration: clip.duration,
    ...meta,
  };
});
