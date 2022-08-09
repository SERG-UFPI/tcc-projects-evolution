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

    const totalIdentifier = [];
    const info = [];
    const authorsTotalCommitsList = [];
    let aux2 = [];
    let authorDict = {};

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (aux2.indexOf(elem.identifier) == -1) {
          const key = elem.identifier;
          const value = elem.author;
          authorDict[`${key}`] = value;
          aux2.push(elem.identifier);
        }

        info.push({ author: elem.author, identifier: elem.identifier });
        totalIdentifier.push(elem.identifier);
      }
    });

    const nonRepeatedIdentifier = totalIdentifier.filter(
      (identifier, index) => totalIdentifier.indexOf(identifier) === index
    );

    nonRepeatedIdentifier.forEach((identifier) =>
      authorsTotalCommitsList.push(
        totalIdentifier.filter((x) => x == identifier).length
      )
    );

    let nonRepeatedAuthors = [];
    let aux = [];
    info.forEach((elem) => {
      if (aux.indexOf(elem.identifier) == -1) {
        nonRepeatedAuthors.push(elem.author);
        aux.push(elem.identifier);
      }
    });

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

export default CommitsAuthorsGraph;
