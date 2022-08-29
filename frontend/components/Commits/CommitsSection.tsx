import styles from '../../styles/Home.module.css';
import CommitsAuthorsGraph from './CommitsAuthorsGraph';
import CommitsAuthorsLinesGraph from './CommitsAuthorsLinesGraph';
import CommitsIssuesLinkGraph from './CommitsIssuesLinkGraph';
import CommitsLinesGraph from './CommitsLinesGraph';

interface CommitsSectionProps {
  commits: any[];
  metrics: any[];
  users: any;
  start: string | undefined;
  end: string | undefined;
}

const CommitsSection = (props: CommitsSectionProps) => {
  return (
    <div className={styles.pageComponents}>
      <h2 style={{ textAlign: 'center' }}>Commits</h2>
      <div className={styles.commitsContainer}>
        <CommitsAuthorsGraph
          commits={props.metrics}
          users={props.users}
          start={props.start}
          end={props.end}
        />
        <CommitsLinesGraph
          commits={props.commits}
          start={props.start}
          end={props.end}
        />
        <CommitsIssuesLinkGraph
          commits={props.commits}
          users={props.users}
          start={props.start}
          end={props.end}
        />
        <CommitsAuthorsLinesGraph
          commits={props.commits}
          users={props.users}
          start={props.start}
          end={props.end}
        />
      </div>
    </div>
  );
};

export default CommitsSection;
