import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import Popup from 'reactjs-popup';
import CommitsLinesModal from '../Modal/Commits/CommitsLinesModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsLinesProps {
  commits: any[];
  users: any;
  start: string | undefined;
  end: string | undefined;
}

const CommitsLinesGraph = (props: CommitsLinesProps) => {
  const [addedFiles, setAddedFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [dateCommits, setDateCommits] = useState([]);
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const parseDate = (date) => {
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  };

  const linesAddedRemoved = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;
    
    const [addedList, removedList, dates] = [[], [], []];
    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        let commitDate = parseDate(elem.date);
        let indexRepeatedDate = dates.indexOf(commitDate);

        if (indexRepeatedDate == -1) {
          dates.push(commitDate);
          addedList.push(elem.lines_added);
          removedList.push(-elem.lines_removed);
        } else {
          addedList[indexRepeatedDate] += elem.lines_added;
          removedList[indexRepeatedDate] -= elem.lines_removed;
        }
      }
    });

    setDateCommits([...dates]);
    setAddedFiles([...addedList]);
    setRemovedFiles([...removedList]);
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
          onClick={(event) => {
            setPoint(event.points[0]);
            setOpen(true);
          }}
        />
      </div>
      <Popup open={open} onClose={closeModal}>
        <CommitsLinesModal
          onCloseModal={closeModal}
          point={point}
          commits={props.commits}
          users={props.users}
          start={props.start}
          end={props.end}
        />
      </Popup>
    </>
  );
};

export default CommitsLinesGraph;
