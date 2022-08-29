import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface IssuesAuthorsProps {
  issues: any[];
  start: string | undefined;
  end: string | undefined;
}

const IssuesAuthorsGraph = (props: IssuesAuthorsProps) => {
  const [authors, setAuthors] = useState([]);
  const [authorsTotalIssues, setAuthorsTotalIssues] = useState([]);

  const issuesByAuthors = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const [totalAuthors, authorsTotalIssuesList] = [[], []];

    response.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      )
        totalAuthors.push(elem.creator);
    });

    const nonRepeatedAuthors = totalAuthors.filter(
      (author, index) => totalAuthors.indexOf(author) === index
    );

    nonRepeatedAuthors.forEach((author) =>
      authorsTotalIssuesList.push(
        totalAuthors.filter((x) => x == author).length
      )
    );

    setAuthors([...nonRepeatedAuthors]);
    setAuthorsTotalIssues([...authorsTotalIssuesList]);
  };

  useEffect(() => {
    issuesByAuthors(props.issues);
  }, []);

  useEffect(() => {
    issuesByAuthors(props.issues, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
      <div className={styles.plot}>
        <p>Autores de Issues</p>
        <Plot
          data={[
            {
              type: 'pie',
              values: authorsTotalIssues,
              labels: authors,
              textinfo: 'label+percent',
              textposition: 'inside',
              automargin: true,
            },
          ]}
          layout={{
            height: 400,
            width: 655,
            margin: { t: 50, b: 50, l: 0, r: 0 },
            showlegend: false,
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
          }}
        />
      </div>
    </>
  );
};

export default IssuesAuthorsGraph;
