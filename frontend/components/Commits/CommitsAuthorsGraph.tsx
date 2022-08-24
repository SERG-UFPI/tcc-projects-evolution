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

  const commitsByAuthors = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const totalCommits = [];
    let [commitsIdentifier, authorsDict] = [{}, {}];
    response.data['metrics'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (!(elem.identifier in commitsIdentifier)) {
          authorsDict[elem.identifier] = elem.author;
          commitsIdentifier[elem.identifier] = { total: 1 };
        } else commitsIdentifier[elem.identifier]['total'] += 1;
      }
    });

    const aux = Object.keys(commitsIdentifier);
    const values = Object.values(commitsIdentifier);

    values.forEach((value) => {
      totalCommits.push(value['total']);
    });

    const [labels, newResultCommits] = [[], []];
    aux.forEach((identifier) => {
      labels.push(authorsDict[identifier]);
    });

    let count = 0;
    aux.forEach((identifier) => {
      if (labels.indexOf(authorsDict[identifier]) != -1) {
        let index = labels.indexOf(authorsDict[identifier]);
        let identifierIndex = aux.indexOf(identifier);
        newResultCommits[index] =
          totalCommits[index] + totalCommits[identifierIndex];
      } else newResultCommits.push(totalCommits[count]);

      labels.push(authorsDict[identifier]);
      count++;
    });

    setCommits([labels, newResultCommits]);
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
              labels: commits[0],
              values: commits[1],
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
