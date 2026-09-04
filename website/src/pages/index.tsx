import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const demo1 = useBaseUrl('/img/demo.gif');
  const demo2 = useBaseUrl('/img/demo2.gif');

  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden />
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>react-native-flash-reels</p>
          <Heading as="h1" className={styles.title}>
            {siteConfig.title}
          </Heading>
          <p className={styles.subtitle}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button button--lg', styles.primaryCta)}
              to="/docs/intro"
            >
              Get started
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryCta)}
              href="https://github.com/thedev204/react-native-flash-reels"
            >
              GitHub
            </Link>
          </div>
        </div>

        <div className={styles.demoRow}>
          <img
            className={styles.demoPhone}
            src={demo1}
            alt="Flash Reels demo — mute, overlay, and progress bar"
            width={220}
            height={489}
          />
          <img
            className={styles.demoPhone}
            src={demo2}
            alt="Flash Reels demo — vertical snap feed"
            width={220}
            height={489}
          />
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
