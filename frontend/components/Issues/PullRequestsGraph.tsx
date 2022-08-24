import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface PullRequestsProps {
  pullRequests: any[];
  start: string | undefined;
  end: string | undefined;
}

const PullRequestsGraph = (props: PullRequestsProps) => {
  const [graphLabel, setGraphLabel] = useState([]);
  const [lifetimeValues, setlifetimeValues] = useState([]);
  const [pullRequestsInfo, setPullRequestsInfo] = useState([]);

  const parsePullRequests = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const countReviewersAndComments = [];
    const countReviewersOrComments = [];
    const countNoReviewersNoComments = [];
    const lifetimeValues = [];

    response.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.closed >= start && elem.closed <= end) ||
        (elem.closed >= start && !end) ||
        (elem.closed <= end && !start)
      ) {
        if (elem.was_merged == true) {
          lifetimeValues.push(elem.active_days);

          if (elem.reviewers.length > 0 && elem.comments > 0)
            countReviewersAndComments.push(elem.number);
          else if (elem.reviewers.length > 0 || elem.comments > 0)
            countReviewersOrComments.push(elem.number);
          else countNoReviewersNoComments.push(elem.number);
        }
      }
    });

    const labels = [
      'Revisão e Comentários',
      'Revisão ou Comentários',
      'Sem revisão e Sem comentários',
    ];
    const data = [
      countReviewersAndComments.length,
      countReviewersOrComments.length,
      countNoReviewersNoComments.length,
    ];

    setGraphLabel(labels);
    setPullRequestsInfo(data);
    setlifetimeValues([...lifetimeValues]);
  };

  useEffect(() => {
    parsePullRequests(props.pullRequests);
  }, []);

  useEffect(() => {
    parsePullRequests(props.pullRequests, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              x: graphLabel,
              y: pullRequestsInfo,
              type: 'bar',
            },
          ]}
          layout={{
            barmode: 'stack',
            title: 'Pull Requests',
            font: {
              family: 'Arial, sans-serif',
              color: '#111111',
            },
            yaxis: {
              title: 'Qtd. de PRs Fechadas',
            },
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            width: 655,
          }}
        />
      </div>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              type: 'violin',
              y: lifetimeValues,
              points: false,
              box: {
                visible: true,
              },
              boxpoints: false,
              line: {
                color: 'black',
              },
              fillcolor: '#8dd3c7',
              opacity: 0.6,
              meanline: {
                visible: true,
              },
              x0: 'Qtd. de PRs',
            },
          ]}
          layout={{
            title: 'Tempo de Vida - PR',
            yaxis: {
              zeroline: false,
              title: 'Dias',
            },
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            width: 655,
          }}
        />
      </div>
    </>
  );
};

export default PullRequestsGraph;
