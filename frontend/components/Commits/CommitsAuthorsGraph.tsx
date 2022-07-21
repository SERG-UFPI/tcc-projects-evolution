import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsAuthorsProps {
  commits: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsAuthorsGraph = (props: CommitsAuthorsProps) => {
  const [commits, setCommits] = useState([]);
  const [authorsTotalCommits, setAuthorsTotalCommits] = useState([]);

  const commitsByAuthors = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const totalAuthors = [];
    const authorsTotalCommitsList = [];

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        totalAuthors.push(elem.author);
      }
    });

    const nonRepeatedAuthors = totalAuthors.filter(
      (author, index) => totalAuthors.indexOf(author) === index
    );

    nonRepeatedAuthors.forEach((author) =>
      authorsTotalCommitsList.push(
        totalAuthors.filter((x) => x == author).length
      )
    );

    setCommits([...nonRepeatedAuthors]);
    setAuthorsTotalCommits([...authorsTotalCommitsList]);
  };

  useEffect(() => {
    commitsByAuthors(props.commits);
  }, []);

  useEffect(() => {
    commitsByAuthors(props.commits, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
      <div className={styles.plot}>
        <p>Autores de Commits</p>
        <Plot
          data={[
            {
              type: 'pie',
              values: authorsTotalCommits,
              labels: commits,
              textinfo: 'label+percent',
              textposition: 'inside',
              automargin: true,
            },
          ]}
          layout={{
            height: 400,
            width: 400,
            margin: { t: 50, b: 50, l: 0, r: 0 },
            showlegend: false,
          }}
        />
      </div>
    </>
  );
};

export default CommitsAuthorsGraph;
