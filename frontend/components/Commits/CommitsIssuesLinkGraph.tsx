import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';
import styles from '../../styles/Home.module.css';
import CommitsIssuesLinkModal from '../Modal/Commits/CommitsIssuesLinkModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsIssuesLinkProps {
  commits: any[];
  users: any;
  issues: any[];
  branches: any[];
  branch: string | undefined;
  start: string | undefined;
  end: string | undefined;
}

const CommitsIssuesLinkGraph = (props: CommitsIssuesLinkProps) => {
  const [authors, setAuthors] = useState([]);
  const [commitsIssuesLink, setCommitsIssuesLink] = useState([]);
  const [commitsNonIssuesLink, setNonCommitsWithLink] = useState([]);
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const commitsByMessage = (
    response,
    githubUsers,
    resBranches,
    branch,
    start = undefined,
    end = undefined
  ) => {
    const [authorsDict, users] = [{}, Object.keys(githubUsers.data['users'])];

    const principalBranch = Object.keys(resBranches.data['branches']).includes(
      'main'
    )
      ? 'main'
      : 'master';

    let result = branch
      ? response.data['commits'].filter((el) =>
          resBranches.data['branches'][branch].includes(el.hash)
        )
      : response.data['commits'].filter((el) =>
          resBranches.data['branches'][principalBranch].includes(el.hash)
        );

    result.forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        users.forEach((user) => {
          if (githubUsers.data['users'][user].indexOf(elem.author) != -1) {
            if (user in authorsDict) {
              elem.message.includes('#')
                ? (authorsDict[user]['issueLink'] += 1)
                : (authorsDict[user]['nonIssueLink'] += 1);
            } else {
              elem.message.includes('#')
                ? (authorsDict[user] = { issueLink: 1, nonIssueLink: 0 })
                : (authorsDict[user] = { issueLink: 0, nonIssueLink: 1 });
            }
          }
        });
      }
    });

    const [totalIssuesLink, totalNonIssuesLink] = [[], []];
    Object.values(authorsDict).forEach((elem) => {
      totalIssuesLink.push(elem['issueLink']);
      totalNonIssuesLink.push(elem['nonIssueLink']);
    });

    setAuthors(Object.keys(authorsDict));
    setCommitsIssuesLink([...totalIssuesLink]);
    setNonCommitsWithLink([...totalNonIssuesLink]);
  };

  useEffect(() => {
    commitsByMessage(props.commits, props.users, props.branches, props.branch);
  }, []);

  useEffect(() => {
    commitsByMessage(
      props.commits,
      props.users,
      props.branches,
      props.branch,
      props.start,
      props.end
    );
  }, [props.start, props.end, props.branch]);

  return (
    <>
      <div className={styles.plot}>
        <Plot
          data={[
            {
              x: authors,
              y: commitsIssuesLink,
              name: 'Com Link',
              type: 'bar',
            },
            {
              x: authors,
              y: commitsNonIssuesLink,
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
          onClick={(event) => {
            setPoint(event.points[0]);
            setOpen(true);
          }}
        />
      </div>
      <Popup open={open} onClose={closeModal}>
        <CommitsIssuesLinkModal
          onCloseModal={closeModal}
          point={point}
          commits={props.commits}
          users={props.users}
          issues={props.issues}
          start={props.start}
          end={props.end}
        />
      </Popup>
    </>
  );
};

export default CommitsIssuesLinkGraph;
