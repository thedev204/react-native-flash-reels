import type { ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

export default function DemoStrip(): ReactNode {
  const demo1 = useBaseUrl('/img/demo.gif');
  const demo2 = useBaseUrl('/img/demo2.gif');

  return (
    <div className={styles.strip}>
      <img
        className={styles.phone}
        src={demo1}
        alt="Flash Reels demo"
        width={220}
        height={489}
      />
      <img
        className={styles.phone}
        src={demo2}
        alt="Flash Reels demo"
        width={220}
        height={489}
      />
    </div>
  );
}
