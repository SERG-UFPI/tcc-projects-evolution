import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface IssuesDatesProps {
  issuesDates: any[],
  start: string | undefined;
  end: string | undefined;
}

const IssuesDatesGraph = (props: IssuesDatesProps) => {
  const [createdAt, setCreatedAt] = useState([]);
  const [countCreatedAt, setCountCreatedAt] = useState([]);
  const [closedAt, setClosedAt] = useState([]);
  const [countClosedAt, setCountClosedAt] = useState([]);

  const fillIssuesDates = (
    elem: any,
    dateCreatedList: string[],
    dateClosedList: string[],
    occurrencesByDateCreated: number[],
    occurrencesByDateClosed: number[]
  ) => {
    const parsed =
      elem.date.slice(0, 4) +
      '-' +
      elem.date.slice(4, 6) +
      '-' +
      elem.date.slice(6, 8);

    if (elem['total_created'] != 0 && elem['total_closed'] == 0) {
      dateCreatedList.push(parsed);
      occurrencesByDateCreated.push(elem['total_created']);
    } else if (elem['total_created'] == 0 && elem['total_closed'] != 0) {
      dateClosedList.push(parsed);
      occurrencesByDateClosed.push(elem['total_closed']);
    } else {
      dateCreatedList.push(parsed);
      occurrencesByDateCreated.push(elem['total_created']);
      dateClosedList.push(parsed);
      occurrencesByDateClosed.push(elem['total_closed']);
    }
  };

  const issuesByDates = (response, start = undefined, end = undefined) => {
    let dateCreatedList = [];
    let dateClosedList = [];
    let occurrencesByDateCreated = [];
    let occurrencesByDateClosed = [];

    if (start == '') start = undefined;
    if (end == '') end = undefined;

    response.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        fillIssuesDates(
          elem,
          dateCreatedList,
          dateClosedList,
          occurrencesByDateCreated,
          occurrencesByDateClosed
        );
      }
    });

    setCreatedAt([...dateCreatedList]);
    setCountCreatedAt([...occurrencesByDateCreated]);
    setClosedAt([...dateClosedList]);
    setCountClosedAt([...occurrencesByDateClosed]);
  };


  useEffect(() => {
    issuesByDates(props.issuesDates);
  }, []);

  useEffect(() => {
    issuesByDates(props.issuesDates, props.start, props.end);
  }, [props.start,  props.end]);

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
