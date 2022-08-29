/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface IssuesLifetimeProps {
  issues: any[];
  start: string | undefined;
  end: string | undefined;
}

const IssuesLifetimeGraph = (props: IssuesLifetimeProps) => {
  const [lifetimeValues, setlifetimeValues] = useState([]);

  const issuesByLifetime = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const lifetime = [];
    response.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.closed_at >= start && elem.closed_at <= end) ||
        (elem.closed_at >= start && !end) ||
        (elem.closed_at <= end && !start)
      )
        lifetime.push(elem.active_days);
    });

    setlifetimeValues(lifetime);
  };

  useEffect(() => {
    issuesByLifetime(props.issues);
  }, []);

  useEffect(() => {
    issuesByLifetime(props.issues, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
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
              x0: 'Qtd. Issues',
            },
          ]}
          layout={{
            title: 'Tempo de Vida',
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

export default IssuesLifetimeGraph;
