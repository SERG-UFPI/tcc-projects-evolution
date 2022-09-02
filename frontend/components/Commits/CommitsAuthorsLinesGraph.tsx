import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import Popup from 'reactjs-popup';
import CommitsAuthorsLinesModal from '../Modal/Commits/CommitsAuthorsLinesModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsAuthorsLinesProps {
  commits: any[];
  users: any;
  start: string | undefined;
  end: string | undefined;
}

const CommitsAuthorsLinesGraph = (props: CommitsAuthorsLinesProps) => {
  const [authors, setAuthors] = useState([]);
  const [info, setInfo] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const parseDate = (date) => {
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
  };

  const commitsByMessage = (
    response,
    githubUsers,
    start = undefined,
    end = undefined
  ) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const [authorsDict, users] = [{}, Object.keys(githubUsers.data['users'])];
    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        let commitDate = parseDate(elem.date);

        users.forEach((user) => {
          if (githubUsers.data['users'][user].indexOf(elem.author) != -1) {
            if (user in authorsDict) {
              let indexRepeatedDate =
                authorsDict[user].dates.indexOf(commitDate);

              if (indexRepeatedDate != -1) {
                authorsDict[user].added[indexRepeatedDate] += elem.lines_added;
                authorsDict[user].removed[indexRepeatedDate] -=
                  elem.lines_removed;
              } else {
                authorsDict[user].added.push(elem.lines_added);
                authorsDict[user].removed.push(-elem.lines_removed);
                authorsDict[user].dates.push(commitDate);
              }
            } else {
              authorsDict[user] = { added: [elem.lines_added] };
              authorsDict[user].removed = [-elem.lines_removed];
              authorsDict[user].dates = [commitDate];
            }
          }
        });
      }
    });

    const info = [];
    Object.values(authorsDict).forEach((value) => {
      info.push([value['dates'], value['added'], value['removed']]);
    });

    setAuthors(Object.keys(authorsDict));
    setInfo([...info]);
  };

  useEffect(() => {
    commitsByMessage(props.commits, props.users);
  }, []);

  useEffect(() => {
    commitsByMessage(props.commits, props.users, props.start, props.end);
  }, [props.start, props.end]);

  return (
    <>
      <div className={styles.plot}>
        <div className={styles.plotCarousel}>
          <button
            onClick={() => {
              if (carouselIndex == 0) {
                setCarouselIndex(authors.length - 1);
              } else {
                setCarouselIndex(carouselIndex - 1);
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <Plot
            data={[
              {
                x: info[carouselIndex] ? info[carouselIndex][0] : null,
                y: info[carouselIndex] ? info[carouselIndex][1] : null,
                type: 'bar',
                name: 'Adicionadas',
                marker: {
                  color: 'rgb(58, 156, 31)',
                },
              },
              {
                x: info[carouselIndex] ? info[carouselIndex][0] : null,
                y: info[carouselIndex] ? info[carouselIndex][2] : null,
                type: 'bar',
                name: 'Removidas',
                marker: {
                  color: 'rgb(242, 47, 36)',
                },
              },
            ]}
            layout={{
              title: `Linhas Adicionadas e Removidas por: ${authors[carouselIndex]}`,
              width: 600,
              paper_bgcolor: '#fafafa',
              plot_bgcolor: '#fafafa',
              font: {
                family: 'Arial, sans-serif',
                color: '#111111',
              },
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
          <button
            onClick={() => {
              if (authors.length - 1 == carouselIndex) {
                setCarouselIndex(0);
              } else {
                setCarouselIndex(carouselIndex + 1);
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
      <Popup open={open} onClose={closeModal}>
        <CommitsAuthorsLinesModal
          onCloseModal={closeModal}
          point={point}
          commits={props.commits}
          users={props.users}
          author={authors[carouselIndex]}
          start={props.start}
          end={props.end}
        />
      </Popup>
    </>
  );
};

export default CommitsAuthorsLinesGraph;
