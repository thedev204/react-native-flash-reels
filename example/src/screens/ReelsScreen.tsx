import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashReels } from 'react-native-flash-reels';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { ReelOverlay } from '../components/ReelOverlay';
import {
  CommentsBottomSheet,
  type Comment,
} from '../components/CommentsBottomSheet';
import { mockReels, type MockReel } from '../data/mockReels';

const PAGE_SIZE = 5;

const SEED_COMMENTS: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      username: 'alex',
      text: 'That light is unreal.',
    },
  ],
  '3': [
    {
      id: 'c2',
      username: 'riya',
      text: 'Where is this market?',
    },
    {
      id: 'c3',
      username: 'jon',
      text: 'Third stall from the left — trust me.',
    },
  ],
};

function takePage(page: number): MockReel[] {
  const start = page * PAGE_SIZE;
  return mockReels.slice(start, start + PAGE_SIZE);
}

export function ReelsScreen() {
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [commentsById, setCommentsById] =
    useState<Record<string, Comment[]>>(SEED_COMMENTS);

  const [page, setPage] = useState(0);
  const [reels, setReels] = useState<MockReel[]>(() => takePage(0));
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const hasMore = reels.length < mockReels.length;

  const commentsOpen = activeReelId != null;
  const activeComments = useMemo(
    () => (activeReelId ? (commentsById[activeReelId] ?? []) : []),
    [activeReelId, commentsById]
  );

  const handleLike = useCallback((item: MockReel) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  }, []);

  const handleLikePress = useCallback((item: MockReel) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  }, []);

  const handleShare = useCallback(async (item: MockReel) => {
    try {
      await Share.share({
        message: `Check out @${item.username}: ${item.caption}\n${item.videoUri}`,
        url: item.videoUri,
        title: `Reel by @${item.username}`,
      });
    } catch {
      // User dismissed the share sheet or share failed — no-op.
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setPage(0);
      setReels(takePage(0));
      setRefreshing(false);
    }, 600);
  }, []);

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || refreshing) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const nextChunk = takePage(nextPage);
      if (nextChunk.length > 0) {
        setPage(nextPage);
        setReels((prev) => [...prev, ...nextChunk]);
      }
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }, 400);
  }, [hasMore, page, refreshing]);

  const renderOverlay = useCallback(
    (item: MockReel, meta: { index: number; isActive: boolean }) => (
      <ReelOverlay
        item={item}
        isActive={meta.isActive}
        liked={likedIds.has(item.id)}
        onLikePress={() => handleLikePress(item)}
        onCommentPress={() => setActiveReelId(item.id)}
        onSharePress={() => {
          handleShare(item);
        }}
      />
    ),
    [likedIds, handleLikePress, handleShare]
  );

  const listFooter = useMemo(
    () =>
      loadingMore ? (
        <View style={styles.footer}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null,
    [loadingMore]
  );

  return (
    // Bottom safe area lifts the feed (progress bar). The comments sheet is
    // absolutely positioned and ignores this padding, so its composer uses
    // BottomSheetFooter bottomInset separately.
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <FlashReels
        data={reels}
        muted={muted}
        onMuteChange={setMuted}
        onLike={handleLike}
        preloadWindowSize={1}
        showProgressBar
        showBufferingLoader
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={listFooter}
        renderOverlay={renderOverlay}
        likeIcon={<Ionicons name="heart" size={64} color="#ff2d55" />}
      />
      <CommentsBottomSheet
        visible={commentsOpen}
        comments={activeComments}
        onClose={() => setActiveReelId(null)}
        onSubmit={(text) => {
          if (!activeReelId) {
            return;
          }
          setCommentsById((prev) => {
            const existing = prev[activeReelId] ?? [];
            return {
              ...prev,
              [activeReelId]: [
                ...existing,
                {
                  id: `${activeReelId}-${Date.now()}`,
                  username: 'you',
                  text,
                },
              ],
            };
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
