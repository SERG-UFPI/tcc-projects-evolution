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

  const commitsByMessage = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const issueLinkAuthors = [];
    const nonIssueLinkAuthors = [];
    const issueLinkTotal = [];
    const nonIssueLinkTotal = [];
    const aux = [];
    let authorsDict = {};

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (aux.indexOf(elem.identifier) == -1) {
          authorsDict[`${elem.identifier}`] = elem.author;
          aux.push(elem.identifier);
        }

        if (!elem.message.includes('Merge')) {
          if (!elem.message.includes('bot')) {
            elem.message.includes('#')
              ? issueLinkAuthors.push(elem.identifier)
              : nonIssueLinkAuthors.push(elem.identifier);
          }
        }
      }
    });

    const nonRepeatedIssueLinkAuthors = issueLinkAuthors.filter(
      (author, index) => issueLinkAuthors.indexOf(author) === index
    );

    const nonRepeatedNonIssueLinkAuthors = nonIssueLinkAuthors.filter(
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

    const linkAuthors = [];
    const nonLinkAuthors = [];

    nonRepeatedIssueLinkAuthors.forEach((el) =>
      linkAuthors.push(authorsDict[el])
    );

    nonRepeatedNonIssueLinkAuthors.forEach((el) =>
      nonLinkAuthors.push(authorsDict[el])
    );

    setcommitLinkAuthors([...linkAuthors]);
    setNonCommitLinkAuthors([...nonLinkAuthors]);
    setCommitsWithLink([...issueLinkTotal]);
    setCommitsWithoutLink([...nonIssueLinkTotal]);
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
        <Plot
          data={[
            {
              x: commitLinkAuthors,
              y: commitsWithLink,
              name: 'Com Link',
              type: 'bar',
            },
            {
              x: nonCommitLinkAuthors,
              y: commitsWithoutLink,
              name: 'Sem Link',
              type: 'bar',
            },
          ]}
          layout={{
            barmode: 'stack',
            title: 'Commits Issues Link',
            font: {
              family: 'Arial, sans-serif',
              color: '#111111',
            },
            yaxis: {
              title: 'Qtd. de Commits',
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

export default CommitsIssuesLinkGraph;
