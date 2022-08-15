import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsLinesProps {
  commits: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsLinesGraph = (props: CommitsLinesProps) => {
  const [addedFiles, setAddedFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [dateCommits, setDateCommits] = useState([]);

  const linesAddedRemoved = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const addedFiles = [];
    const removedFiles = [];
    const dates = [];

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        const parsed =
          elem.date.slice(0, 4) +
          '-' +
          elem.date.slice(4, 6) +
          '-' +
          elem.date.slice(6, 8);
        dates.push(parsed);
        addedFiles.push(elem.lines_added);
        removedFiles.push(-elem.lines_removed);
      }
    });

    setDateCommits([...dates]);
    setAddedFiles([...addedFiles]);
    setRemovedFiles([...removedFiles]);
  };

  useEffect(() => {
    linesAddedRemoved(props.commits);
  }, []);

  useEffect(() => {
    linesAddedRemoved(props.commits, props.start, props.end);
  }, [props.start, props.end, props.commits]);

  return (
    <>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              type: 'bar',
              y: addedFiles,
              x: dateCommits,
              name: 'Adicionadas',
              marker: {
                color: 'rgb(58, 156, 31)',
              },
            },
            {
              type: 'bar',
              y: removedFiles,
              x: dateCommits,
              name: 'Removidas',
              marker: {
                color: 'rgb(242, 47, 36)',
              },
            },
          ]}
          layout={{
            title: 'Linhas Adicionadas e Removidas',
            paper_bgcolor: '#fafafa',
            plot_bgcolor: '#fafafa',
            width: 655,
            xaxis: {
              type: 'date',
              title: 'Datas',
            },
            yaxis: {
              title: 'Linhas',
            },
          }}
        />
      </div>
    </>
  );
};

export default CommitsLinesGraph;
