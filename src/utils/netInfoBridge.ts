import type { NetworkAwareState } from './networkAware';
import { networkKindFromNetInfoType } from './networkAware';

type NetInfoModule = {
  addEventListener: (
    listener: (state: { type: string; isConnected: boolean | null }) => void
  ) => () => void;
  fetch: () => Promise<{ type: string; isConnected: boolean | null }>;
};

let warnedMissingNetInfo = false;

/**
 * Soft-load optional `@react-native-community/netinfo`.
 * Returns null when the peer is not installed.
 */
export function tryGetNetInfo(): NetInfoModule | null {
  try {
    return require('@react-native-community/netinfo').default as NetInfoModule;
  } catch {
    return null;
  }
}

export function warnMissingNetInfoOnce(): void {
  if (warnedMissingNetInfo) {
    return;
  }
  warnedMissingNetInfo = true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      '[FlashReels] networkAware is true but @react-native-community/netinfo is not installed. Install it or set networkAware={false}.'
    );
  }
}

/** Test helper. */
export function resetNetInfoWarning(): void {
  warnedMissingNetInfo = false;
}

export function subscribeNetworkAware(
  onChange: (state: NetworkAwareState) => void
): (() => void) | null {
  const NetInfo = tryGetNetInfo();
  if (NetInfo == null) {
    return null;
  }

  let cancelled = false;

  NetInfo.fetch()
    .then((state) => {
      if (cancelled) {
        return;
      }
      onChange(networkKindFromNetInfoType(state.type, state.isConnected));
    })
    .catch(() => {
      // Soft-fail — stay on defaults.
    });

  const unsubscribe = NetInfo.addEventListener((state) => {
    onChange(networkKindFromNetInfoType(state.type, state.isConnected));
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}
