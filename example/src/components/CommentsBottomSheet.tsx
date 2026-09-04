import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Comment {
  id: string;
  username: string;
  text: string;
}

interface CommentsBottomSheetProps {
  visible: boolean;
  comments: Comment[];
  onClose: () => void;
  onSubmit: (text: string) => void;
}

/**
 * Lives only in the example app — comments UI is a product decision, not a
 * feed-mechanics concern, so it stays out of the library core.
 *
 * Composer sits in BottomSheetFooter so it stays pinned to the sheet bottom.
 * Use adjustPan + interactive keyboard so the footer actually lifts above the
 * keyboard (adjustResize zeroes gorhom's keyboard offset and relies on native
 * resize, which often fails with immersive / edge-to-edge Android windows).
 */
export function CommentsBottomSheet({
  visible,
  comments,
  onClose,
  onSubmit,
}: CommentsBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const snapPoints = useMemo(() => ['50%', '78%'], []);
  const draftRef = useRef('');
  const textInputRef = useRef<any>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const submit = useCallback(() => {
    const text = draftRef.current.trim();
    if (!text) {
      return;
    }
    onSubmit(text);
    draftRef.current = '';
    textInputRef.current?.clear?.();
  }, [onSubmit]);

  useEffect(() => {
    if (visible) {
      return;
    }
    draftRef.current = '';
    textInputRef.current?.clear?.();
  }, [visible]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      // bottomInset lifts the composer above the Android nav / home indicator
      // when the keyboard is closed. When the keyboard is open, gorhom drops
      // this inset and uses keyboard height instead (see BottomSheetFooter).
      <BottomSheetFooter {...props} bottomInset={bottomInset}>
        <View style={styles.composer}>
          <BottomSheetTextInput
            placeholder="Add a comment…"
            placeholderTextColor="#888"
            style={styles.input}
            ref={textInputRef}
            defaultValue=""
            onChangeText={(text) => {
              draftRef.current = text;
            }}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable onPress={submit} style={styles.send} hitSlop={8}>
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [bottomInset, submit]
  );

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <View style={styles.row}>
        <Text style={styles.rowUser}>@{item.username}</Text>
        <Text style={styles.rowText}>{item.text}</Text>
      </View>
    ),
    []
  );

  return (
    <BottomSheet
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      // interactive + adjustPan: footer translates by keyboard height.
      // Do not use adjustResize here — it forces heightWithinContainer=0 so
      // the footer never moves, and native resize is unreliable on Android.
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      enableDynamicSizing={false}
      animateOnMount={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
      </View>
      <BottomSheetFlatList
        data={comments}
        keyExtractor={(c: Comment) => c.id}
        style={styles.list}
        // Leave room so the last row isn't hidden under the footer composer.
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 72 + bottomInset },
        ]}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#161616',
  },
  handle: {
    backgroundColor: '#555',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    gap: 4,
  },
  rowUser: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  rowText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    backgroundColor: '#161616',
  },
  input: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  send: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendLabel: {
    color: '#4da3ff',
    fontWeight: '700',
    fontSize: 15,
  },
});
