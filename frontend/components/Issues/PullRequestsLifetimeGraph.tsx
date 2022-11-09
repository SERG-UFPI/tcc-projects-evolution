import dynamic from 'next/dynamic';
import { useState } from 'react';
import Popup from 'reactjs-popup';
import styles from '../../styles/Home.module.css';
import PullRequestsLifetimeModal from '../Modal/Issues/PullRequestsLifetimeModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface PullRequestsProps {
  lifetimeValues: any[];
  pullRequests: any[];
  start: string | undefined;
  end: string | undefined;
}

const PullRequestsGraph = (props: PullRequestsProps) => {
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  return (
    <>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              type: 'violin',
              y: props.lifetimeValues,
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
              title: 'Horas',
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
        <Popup open={open} onClose={closeModal}>
          <PullRequestsLifetimeModal
            onCloseModal={closeModal}
            point={point}
            pullRequests={props.pullRequests}
            start={props.start}
            end={props.end}
          />
        </Popup>
      </div>
    </>
  );
};

export default PullRequestsGraph;
