import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import CommitsSection from '../Commits/CommitsSection';
import IssuesAuthorsGraph from './IssuesAuthorsGraph';
import IssuesDatesGraph from './IssuesDatesGraph';
import IssuesLifetimeGraph from './IssuesLifetimeGraph';

interface IssuesSectionProps {
  issuesDates: any[];
  issuesLifetime: any[];
  issuesAuthors: any[];
  commits: any[];
}

const IssuesSection = (props: IssuesSectionProps) => {
  const [start, setStart] = useState('');
  const [parsedStart, setParsedStart] = useState('');
  const [end, setEnd] = useState('');
  const [parsedEnd, setParsedEnd] = useState('');

  // Para atualizar os gráficos quando as datas mudarem
  useEffect(() => {
    setParsedStart(start.replace(/-/g, ''));
    setParsedEnd(end.replace(/-/g, ''));
  }, [start, end]);

  return (
    <div className={styles.pageComponents}>
      <h2 style={{ textAlign: 'center' }}>Issues</h2>
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
