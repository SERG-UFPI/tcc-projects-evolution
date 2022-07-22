import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsIssuesLinkProps {
  commits: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsIssuesLinkGraph = (props: CommitsIssuesLinkProps) => {
  const [commitLinkAuthors, setcommitLinkAuthors] = useState([]);
  const [nonCommitLinkAuthors, setNonCommitLinkAuthors] = useState([]);
  const [commitsWithLink, setCommitsWithLink] = useState([]);
  const [commitsWithoutLink, setCommitsWithoutLink] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const commitsByMessage = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    let issueLinkAuthors = [];
    let nonIssueLinkAuthors = [];
    let issueLinkTotal = [];
    let nonIssueLinkTotal = [];
    const allAuthors = [];

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (!elem.message.includes('Merge')) {
          if (!elem.message.includes('bot')) {
            elem.message.includes('#')
              ? issueLinkAuthors.push(elem.author)
              : nonIssueLinkAuthors.push(elem.author);
            allAuthors.push(elem.author);
          }
        }
      }
    });

    let nonRepeatAllAuthors = allAuthors.filter(
      (author, index) => allAuthors.indexOf(author) === index
    );

    let nonRepeatedIssueLinkAuthors = issueLinkAuthors.filter(
      (author, index) => issueLinkAuthors.indexOf(author) === index
    );

    let nonRepeatedNonIssueLinkAuthors = nonIssueLinkAuthors.filter(
      (author, index) => nonIssueLinkAuthors.indexOf(author) === index
    );

    nonRepeatedIssueLinkAuthors.forEach((author) =>
      issueLinkTotal.push(issueLinkAuthors.filter((x) => x == author).length)
    );

    nonRepeatedNonIssueLinkAuthors.forEach((author) =>
      nonIssueLinkTotal.push(
        nonIssueLinkAuthors.filter((x) => x == author).length
      )
    );

    let newParseCommitLinks = Array(nonRepeatAllAuthors.length).fill(0);
    let newParseNoCommitLinks = Array(nonRepeatAllAuthors.length).fill(0);

    nonRepeatAllAuthors.forEach((author) => {
      let indexAllAuthor = nonRepeatAllAuthors.indexOf(author);

      let indexAuthor = nonRepeatedIssueLinkAuthors.indexOf(author);
      if (indexAuthor != -1) {
        let total = issueLinkTotal[indexAuthor];
        newParseCommitLinks[indexAllAuthor] = total;
      }

      indexAuthor = nonRepeatedNonIssueLinkAuthors.indexOf(author);
      if (indexAuthor != -1) {
        let total = nonIssueLinkTotal[indexAuthor];
        newParseNoCommitLinks[indexAllAuthor] = total;
      }
    });

    setcommitLinkAuthors([...nonRepeatAllAuthors]);
    setCommitsWithLink([...newParseCommitLinks]);
    setCommitsWithoutLink([...newParseNoCommitLinks]);
  };

  useEffect(() => {
    commitsByMessage(props.commits);
  }, []);

  return (
    <>
      <div className={styles.plot}>
        <div className={styles.plotCarousel}>
          <button
            onClick={() => {
              if (carouselIndex == 0) {
                setCarouselIndex(commitLinkAuthors.length - 1);
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
                x: [commitLinkAuthors[carouselIndex]],
                y: [commitsWithLink[carouselIndex]],
                name: 'Com Issue Link',
                type: 'bar',
              },
              {
                x: [commitLinkAuthors[carouselIndex]],
                y: [commitsWithoutLink[carouselIndex]],
                name: 'Sem Issue Link',
                type: 'bar',
              },
            ]}
            layout={{
              title: 'Commits Issue Link',
              barmode: 'group',
              paper_bgcolor: '#fafafa',
              plot_bgcolor: '#fafafa',
            }}
          />
          <button
            onClick={() => {
              if (commitLinkAuthors.length - 1 == carouselIndex) {
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

export default CommitsIssuesLinkGraph;
