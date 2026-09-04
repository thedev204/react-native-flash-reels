import type { ReelData } from 'react-native-flash-reels';

export interface MockReel extends ReelData {
  username: string;
  caption: string;
  likes: number;
  comments: number;
}

/**
 * Public Pexels clips for local demo.
 * `duration` is in seconds (from ffprobe) and is required for a responsive
 * progress bar — without it the bar waits on native metadata (slow on large
 * remote / fragmented MP4s).
 */
const PEXELS_CLIPS: ReadonlyArray<{ uri: string; duration: number }> = [
  {
    uri: 'https://videos.pexels.com/video-files/37566091/15918278_2160_3840_60fps.mp4',
    duration: 6.667,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38783265/16480149_2160_3840_30fps.mp4',
    duration: 10.644,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38262419/16246052_2160_3840_60fps.mp4',
    duration: 7.683,
  },
  {
    uri: 'https://videos.pexels.com/video-files/39037793/16611063_2160_3840_30fps.mp4',
    duration: 9.867,
  },
  {
    uri: 'https://videos.pexels.com/video-files/18089052/18089052-hd_1080_1920_30fps.mp4',
    duration: 52.308,
  },
  {
    uri: 'https://videos.pexels.com/video-files/39000485/16594554_1080_1920_30fps.mp4',
    duration: 6.9,
  },
  {
    uri: 'https://videos.pexels.com/video-files/37050680/15695748_2160_3840_30fps.mp4',
    duration: 12.012,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38923868/16553833_2160_3840_24fps.mp4',
    duration: 6.042,
  },
  {
    uri: 'https://videos.pexels.com/video-files/36745295/15572100_2160_3840_30fps.mp4',
    duration: 11.933,
  },
  {
    uri: 'https://videos.pexels.com/video-files/39007195/16598369_2160_3840_30fps.mp4',
    duration: 30.03,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38791823/16485135_2160_3840_30fps.mp4',
    duration: 17.885,
  },
  {
    uri: 'https://videos.pexels.com/video-files/13600150/13600150-hd_1080_1920_30fps.mp4',
    duration: 20.153,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38299669/16262645_2160_3840_60fps.mp4',
    duration: 6.667,
  },
  {
    uri: 'https://videos.pexels.com/video-files/38242964/16238992_2160_3840_30fps.mp4',
    duration: 15.015,
  },
  {
    uri: 'https://videos.pexels.com/video-files/9328681/9328681-uhd_2160_4096_25fps.mp4',
    duration: 19.28,
  },
];

const META: Array<Omit<MockReel, 'id' | 'videoUri' | 'duration'>> = [
  {
    username: 'maya.builds',
    caption: 'Golden hour on the rooftop — no filter needed.',
    likes: 12840,
    comments: 312,
  },
  {
    username: 'coastal.frames',
    caption: 'Weekend escape. Pack light, leave early.',
    likes: 9021,
    comments: 188,
  },
  {
    username: 'night.market',
    caption: 'Street food tour, round three. Worth the wait.',
    likes: 22104,
    comments: 540,
  },
  {
    username: 'wheel.spin',
    caption: 'Empty roads and a full tank.',
    likes: 15670,
    comments: 276,
  },
  {
    username: 'studio.late',
    caption: 'Last take of the night. Rolling.',
    likes: 7743,
    comments: 141,
  },
  {
    username: 'lens.drift',
    caption: 'Soft light, long walks, zero rush.',
    likes: 11452,
    comments: 203,
  },
  {
    username: 'city.pulse',
    caption: 'Neon reflections after rain.',
    likes: 18990,
    comments: 421,
  },
  {
    username: 'trail.notes',
    caption: 'Found a quieter trail today.',
    likes: 6532,
    comments: 97,
  },
  {
    username: 'kitchen.fire',
    caption: 'One-pan dinner, five minutes flat.',
    likes: 24118,
    comments: 612,
  },
  {
    username: 'wave.watch',
    caption: 'Tide coming in. Camera ready.',
    likes: 13207,
    comments: 255,
  },
  {
    username: 'frame.by.frame',
    caption: 'Practice reel — still learning the cut.',
    likes: 4810,
    comments: 88,
  },
  {
    username: 'skyline.am',
    caption: 'Coffee before the city wakes up.',
    likes: 16734,
    comments: 349,
  },
  {
    username: 'motion.lab',
    caption: 'Handheld chaos, intentional vibes.',
    likes: 9988,
    comments: 176,
  },
  {
    username: 'north.route',
    caption: 'Cold air, warm layers, long drive.',
    likes: 14322,
    comments: 290,
  },
  {
    username: 'after.hours',
    caption: 'Quiet corners of a loud night.',
    likes: 20551,
    comments: 477,
  },
  {
    username: 'bloom.daily',
    caption: 'New growth, same old patience.',
    likes: 8120,
    comments: 134,
  },
  {
    username: 'glass.tower',
    caption: 'Reflections on reflections.',
    likes: 11903,
    comments: 210,
  },
  {
    username: 'slow.zoom',
    caption: 'Hold the shot a second longer.',
    likes: 7066,
    comments: 119,
  },
  {
    username: 'market.run',
    caption: 'Fresh produce, louder vendors.',
    likes: 17640,
    comments: 388,
  },
  {
    username: 'dusk.drive',
    caption: 'That stretch of road again.',
    likes: 15228,
    comments: 301,
  },
  {
    username: 'clip.board',
    caption: 'B-roll dump from last week.',
    likes: 5441,
    comments: 76,
  },
  {
    username: 'rain.check',
    caption: 'Umbrella optional. Vibes required.',
    likes: 19870,
    comments: 452,
  },
  {
    username: 'harbor.line',
    caption: 'Boats, cables, morning mist.',
    likes: 10214,
    comments: 167,
  },
  {
    username: 'edit.desk',
    caption: 'Color grade pending. Feel free.',
    likes: 6899,
    comments: 112,
  },
  {
    username: 'street.sketch',
    caption: 'Faces, footsteps, one continuous take.',
    likes: 23105,
    comments: 528,
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
];

/**
 * 30 demo reels cycling 15 public Pexels clips.
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
