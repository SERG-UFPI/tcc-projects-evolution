import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsAuthorsLinesProps {
  commits: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsAuthorsLinesGraph = (props: CommitsAuthorsLinesProps) => {
  const [authors, setAuthors] = useState([]);
  const [info, setInfo] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const commitsByMessage = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const dates = [];
    const allAuthors = [];
    const addedLines = [];
    const removedLines = [];

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (!elem.author.includes('bot')) {
          const parsed =
            elem.date.slice(0, 4) +
            '-' +
            elem.date.slice(4, 6) +
            '-' +
            elem.date.slice(6, 8);
          dates.push(parsed);
          allAuthors.push(elem.author);
          addedLines.push(elem.lines_added);
          removedLines.push(elem.lines_removed);
        }
      }
    });

    const nonRepeatAllAuthors = allAuthors.filter(
      (author, index) => allAuthors.indexOf(author) === index
    );

    let dateByAuthor = [];
    let addedByAuthor = [];
    let removedByAuthor = [];
    let info = [];
    nonRepeatAllAuthors.forEach((elem) => {
      for (var i = 0; i < allAuthors.length; i++) {
        if (allAuthors[i] == elem) {
          dateByAuthor.push(dates[i]);
          addedByAuthor.push(addedLines[i]);
          removedByAuthor.push(-removedLines[i]);
        }
      }
      info.push([dateByAuthor, addedByAuthor, removedByAuthor]);
      dateByAuthor = [];
      addedByAuthor = [];
      removedByAuthor = [];
    });

    setInfo([...info]);
    setAuthors([...nonRepeatAllAuthors]);
  };

  useEffect(() => {
    commitsByMessage(props.commits);
  }, []);

  useEffect(() => {
    commitsByMessage(props.commits, props.start, props.end);
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
                type: 'scatter',
                x: info[carouselIndex] ? info[carouselIndex][0] : null,
                y: info[carouselIndex] ? info[carouselIndex][1] : null,
                mode: 'lines',
                name: 'Adicionadas',
                line: {
                  color: 'rgb(58, 156, 31)',
                  width: 2,
                },
              },
              {
                type: 'scatter',
                x: info[carouselIndex] ? info[carouselIndex][0] : null,
                y: info[carouselIndex] ? info[carouselIndex][2] : null,
                mode: 'lines',
                name: 'Removidas',
                line: {
                  color: 'rgb(242, 47, 36)',
                  width: 2,
                },
              },
            ]}
            layout={{
              title: `Linhas Adicionadas e Removidas por: ${authors[carouselIndex]}`,
              width: 650,
              height: 500,
              paper_bgcolor: '#fafafa',
              plot_bgcolor: '#fafafa',
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
    </>
  );
};

export default CommitsAuthorsLinesGraph;
