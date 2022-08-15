import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import CommitsSection from '../Commits/CommitsSection';
import IssuesAuthorsGraph from './IssuesAuthorsGraph';
import IssuesDatesGraph from './IssuesDatesGraph';
import IssuesLifetimeGraph from './IssuesLifetimeGraph';
//import PullRequestsGraph from './PullRequestsGraph';

interface IssuesSectionProps {
  issuesDates: any[];
  issuesLifetime: any[];
  issuesAuthors: any[];
  pullRequests: any[];
  commits: any[];
}

const IssuesSection = (props: IssuesSectionProps) => {
  const [start, setStart] = useState('');
  const [parsedStart, setParsedStart] = useState('');
  const [end, setEnd] = useState('');
  const [parsedEnd, setParsedEnd] = useState('');

  const captureStartEndDate = (responseIssues, responseCommits) => {
    const firstIssueDate = responseIssues.data['issues'][0].date;
    const lastIssueDate =
      responseIssues.data['issues'][responseIssues.data['issues'].length - 1]
        .date;
    const firsCommitDate = responseCommits.data['commits'][0].date;
    const lastCommitDate =
      responseCommits.data['commits'][
        responseCommits.data['commits'].length - 1
      ].date;
    let begin = '';
    let end = '';

    if (firstIssueDate <= firsCommitDate) begin = firstIssueDate;
    else begin = firsCommitDate;

    if (lastIssueDate >= lastCommitDate) end = lastIssueDate;
    else end = lastCommitDate;

    const parsedBegin =
      begin.slice(0, 4) + '-' + begin.slice(4, 6) + '-' + begin.slice(6, 8);
    const parsedEnd =
      end.slice(0, 4) + '-' + end.slice(4, 6) + '-' + end.slice(6, 8);

    setStart(parsedBegin);
    setEnd(parsedEnd);
  };

  useEffect(() => {
    captureStartEndDate(props.issuesDates, props.commits);
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
      <hr />
      <h2 style={{ textAlign: 'center' }}>Issues</h2>
      <div className={styles.issuesContainer}>
        <IssuesDatesGraph
          issuesDates={props.issuesDates}
          start={parsedStart}
          end={parsedEnd}
        />
        <IssuesLifetimeGraph
          issuesLifetime={props.issuesLifetime}
          start={parsedStart}
          end={parsedEnd}
        />
        <IssuesAuthorsGraph
          issuesAuthors={props.issuesAuthors}
          start={parsedStart}
          end={parsedEnd}
        />
        {/* <PullRequestsGraph
          pullRequests={props.pullRequests}
          start={parsedStart}
          end={parsedEnd}
        /> */}
      </div>
      <hr />
      <CommitsSection
        commits={props.commits}
        start={parsedStart}
        end={parsedEnd}
      />
    </div>
  );
};

export default IssuesSection;
