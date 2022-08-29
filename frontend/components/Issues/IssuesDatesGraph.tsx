import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface IssuesDatesProps {
  issues: any[];
  start: string | undefined;
  end: string | undefined;
}

const IssuesDatesGraph = (props: IssuesDatesProps) => {
  const [createdAt, setCreatedAt] = useState([]);
  const [countCreatedAt, setCountCreatedAt] = useState([]);
  const [closedAt, setClosedAt] = useState([]);
  const [countClosedAt, setCountClosedAt] = useState([]);

  const parseDate = (date) => {
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  };

  const issuesByDates = (response, start = undefined, end = undefined) => {
    const [
      dateCreatedList,
      dateClosedList,
      occurrencesByDateCreated,
      occurrencesByDateClosed,
    ] = [[], [], [], []];

    if (start == '') start = undefined;
    if (end == '') end = undefined;

    response.data['dates'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        let date = parseDate(elem.date);

        if (elem['total_created'] != 0 && elem['total_closed'] == 0) {
          dateCreatedList.push(date);
          occurrencesByDateCreated.push(elem['total_created']);
        } else if (elem['total_created'] == 0 && elem['total_closed'] != 0) {
          dateClosedList.push(date);
          occurrencesByDateClosed.push(elem['total_closed']);
        } else {
          dateCreatedList.push(date);
          occurrencesByDateCreated.push(elem['total_created']);
          dateClosedList.push(date);
          occurrencesByDateClosed.push(elem['total_closed']);
        }
      }
    });

    setCreatedAt([...dateCreatedList]);
    setCountCreatedAt([...occurrencesByDateCreated]);
    setClosedAt([...dateClosedList]);
    setCountClosedAt([...occurrencesByDateClosed]);
  };

  useEffect(() => {
    issuesByDates(props.issues);
  }, []);

  useEffect(() => {
    issuesByDates(props.issues, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              x: createdAt,
              y: countCreatedAt,
              type: 'bar',
              name: 'Criadas',
              marker: {
                color: 'rgb(58, 156, 31)',
              },
            },
            {
              x: closedAt,
              y: countClosedAt,
              type: 'bar',
              name: 'Fechadas',
              marker: {
                color: 'rgb(242, 47, 36)',
              },
            },
          ]}
          layout={{
            barmode: 'stack',
            title: 'Issues',
            font: {
              family: 'Arial, sans-serif',
              color: '#111111',
            },
            xaxis: {
              type: 'date',
              title: 'Datas',
            },
            yaxis: {
              title: 'Quantidade de issues',
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

export default IssuesDatesGraph;
