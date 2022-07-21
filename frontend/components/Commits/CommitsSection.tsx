import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import CommitsAuthorsGraph from './CommitsAuthorsGraph';
import CommitsLinesGraph from './CommitsLinesGraph';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsSectionProps {
  commits: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsSection = (props: CommitsSectionProps) => {
  return (
    <div className={styles.pageComponents}>
      <h2 style={{ textAlign: 'center' }}>Commits</h2>
      <div className={styles.commitsContainer}>
        <CommitsAuthorsGraph
          commits={props.commits}
          start={props.start}
          end={props.end}
        />
        <CommitsLinesGraph
          commits={props.commits}
          start={props.start}
          end={props.end}
        />
      </div>
    </div>
  );
};

export default CommitsSection;
