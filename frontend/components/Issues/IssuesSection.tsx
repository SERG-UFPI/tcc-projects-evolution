import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import CommitsSection from '../Commits/CommitsSection';
import IssuesAuthorsGraph from './IssuesAuthorsGraph';
import IssuesDatesGraph from './IssuesDatesGraph';
import IssuesLifetimeGraph from './IssuesLifetimeGraph';
import PullRequestsGraph from './PullRequestsGraph';
import TypeContributionGraph from './TypeContributionGraph';

interface IssuesSectionProps {
  issues: any[];
  pullRequests: any[];
  commits: any[];
  metrics: any[];
  users: any;
}

const IssuesSection = (props: IssuesSectionProps) => {
  const [start, setStart] = useState('');
  const [parsedStart, setParsedStart] = useState('');
  const [end, setEnd] = useState('');
  const [parsedEnd, setParsedEnd] = useState('');

  const parseDate = (date) => {
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  };

  const captureStartEndDate = (resIssues, resCommits) => {
    const [firstIssueDate, lastIssueDate] = [
      resIssues.data['issues'][0].created_at,
      resIssues.data['issues'][resIssues.data['issues'].length - 1].created_at,
    ];
    const [firsCommitDate, lastCommitDate] = [
      resCommits.data['commits'][0].date,
      resCommits.data['commits'][resCommits.data['commits'].length - 1].date,
    ];
    let [begin, end] = ['', ''];

    begin = firstIssueDate <= firsCommitDate ? firstIssueDate : firsCommitDate;
    end = lastIssueDate >= lastCommitDate ? lastIssueDate : lastCommitDate;

    setStart(parseDate(begin));
    setEnd(parseDate(end));
  };

  useEffect(() => {
    captureStartEndDate(props.issues, props.commits);
  }, []);

  useEffect(() => {
    setParsedStart(start.replace(/-/g, ''));
    setParsedEnd(end.replace(/-/g, ''));
  }, [start, end]);

  return (
    <div className={styles.pageComponents}>
      <div className={styles.inputIssues}>
        <div className={styles.labelInputIssues}>
          <label>Data Inicial</label>
          <input
            type="date"
            placeholder="Data Inicial - Formato: YYYY-MM-DD"
            className={styles.inputData}
            value={start}
            onChange={(ev) => {
              setStart(ev.target.value);
            }}
          />
        </div>
        <div className={styles.labelInputIssues}>
          <label>Data Final</label>
          <input
            type="date"
            placeholder="Data Final - Formato: YYYY-MM-DD"
            className={styles.inputData}
            value={end}
            onChange={(ev) => {
              setEnd(ev.target.value);
            }}
          />
        </div>
        <button
          className={styles.button}
          onClick={() => {
            setStart('');
            setEnd('');
          }}
        >
          {'Limpar'}
        </button>
      </div>

      <h2 style={{ textAlign: 'center' }}>Issues</h2>
      <div className={styles.issuesContainer}>
        <IssuesDatesGraph
          issues={props.issues}
          start={parsedStart}
          end={parsedEnd}
        />
        <IssuesLifetimeGraph
          issues={props.issues}
          start={parsedStart}
          end={parsedEnd}
        />
        <IssuesAuthorsGraph
          issues={props.issues}
          start={parsedStart}
          end={parsedEnd}
        />
        <PullRequestsGraph
          pullRequests={props.pullRequests}
          start={parsedStart}
          end={parsedEnd}
        />
        <TypeContributionGraph
          issues={props.issues}
          pullRequests={props.pullRequests}
          metrics={props.metrics}
          users={props.users}
          start={parsedStart}
          end={parsedEnd}
        />
      </div>
      <hr />
      <CommitsSection
        commits={props.commits}
        metrics={props.metrics}
        users={props.users}
        start={parsedStart}
        end={parsedEnd}
      />
    </div>
  );
};

export default IssuesSection;
