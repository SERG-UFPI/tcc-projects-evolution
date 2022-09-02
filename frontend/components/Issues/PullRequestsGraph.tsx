import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';
import styles from '../../styles/Home.module.css';
import PullRequestsLifetimeGraph from '../Issues/PullRequestsLifetimeGraph';
import PullRequestsModal from '../Modal/Issues/PullRequestsModal';

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
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

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
        if (elem.active_days != null) lifetimeValues.push(elem.active_days);

        if (elem.reviewers.length > 0 && elem.comments > 0)
          countReviewersAndComments.push(elem.number);
        else if (elem.reviewers.length > 0 || elem.comments > 0)
          countReviewersOrComments.push(elem.number);
        else countNoReviewersNoComments.push(elem.number);
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
          onClick={(event) => {
            setPoint(event.points[0]);
            setOpen(true);
          }}
        />
      </div>
      <Popup open={open} onClose={closeModal}>
        <PullRequestsModal
          onCloseModal={closeModal}
          point={point}
          pullRequests={props.pullRequests}
          start={props.start}
          end={props.end}
        />
      </Popup>
      <PullRequestsLifetimeGraph
        lifetimeValues={lifetimeValues}
        pullRequests={props.pullRequests}
        start={props.start}
        end={props.end}
      />
    </>
  );
};

export default PullRequestsGraph;
