import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useFlashReels } from 'react-native-flash-reels';
import type { MockReel } from '../data/mockReels';

interface ReelOverlayProps {
  item: MockReel;
  isActive: boolean;
  liked: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

/**
 * Example-only overlay. The library provides the slot; this layout is a
 * product choice that belongs in the consuming app.
 */
function ExampleMuteButton() {
  const { isMuted, toggleMute } = useFlashReels();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
      onPress={toggleMute}
      style={styles.muteButton}
      hitSlop={12}
    >
      <Ionicons
        name={isMuted ? 'volume-mute' : 'volume-high'}
        size={20}
        color="#fff"
      />
    </Pressable>
  );
}

export function ReelOverlay({
  item,
  isActive,
  liked,
  onLikePress,
  onCommentPress,
  onSharePress,
}: ReelOverlayProps) {
  const { isMuted } = useFlashReels();

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.topBar} pointerEvents="box-none">
        <ExampleMuteButton />
        {!isActive ? null : (
          <Text style={styles.muteHint}>{isMuted ? 'Muted' : 'Sound on'}</Text>
        )}
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        <View style={styles.meta}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onLikePress} style={styles.action} hitSlop={8}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#ff2d55' : '#fff'}
            />
            <Text style={styles.actionCount}>
              {formatCount(item.likes + (liked ? 1 : 0))}
            </Text>
          </Pressable>
          <Pressable onPress={onCommentPress} style={styles.action} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.actionCount}>{formatCount(item.comments)}</Text>
          </Pressable>
          <Pressable
            onPress={onSharePress}
            style={styles.action}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muteHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  meta: {
    flex: 1,
    gap: 6,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  caption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 4,
  },
  action: {
    alignItems: 'center',
    gap: 6,
    minWidth: 40,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
