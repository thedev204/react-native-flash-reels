import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  mark: 'bolt' | 'layers' | 'gauge';
};

const FeatureList: FeatureItem[] = [
  {
    title: 'FlashList v2 paging',
    mark: 'bolt',
    description: (
      <>
        Vertical snap feed tuned for the New Architecture — measured page height
        and scroll-friendly gestures for light, smooth paging.
      </>
    ),
  },
  {
    title: 'Your overlay, your product',
    mark: 'layers',
    description: (
      <>
        Play/pause, mute, likes, and preload stay in the library. Captions,
        comments, and chrome stay in your app via <code>renderOverlay</code>.
      </>
    ),
  },
  {
    title: 'Prefetch & cache',
    mark: 'gauge',
    description: (
      <>
        Opt-in HTTP/poster prefetch, poster-first loading, and RN Video disk
        cache — without raising the decoder window on Android.
      </>
    ),
  },
];

function FeatureMark({ mark }: { mark: FeatureItem['mark'] }) {
  return (
    <div className={clsx(styles.icon, styles[mark])} aria-hidden>
      <span />
    </div>
  );
}

function Feature({ title, description, mark }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.card}>
        <FeatureMark mark={mark} />
        <Heading as="h3" className={styles.cardTitle}>
          {title}
        </Heading>
        <p className={styles.cardBody}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
