import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import Popup from 'reactjs-popup';
import CommitsAuthorsModal from '../Modal/Commits/CommitsAuthorsModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface CommitsAuthorsProps {
  commits: any[];
  users: any;
  branches: any[];
  branch: string | undefined;
  start: string | undefined;
  end: string | undefined;
}

const CommitsAuthorsGraph = (props: CommitsAuthorsProps) => {
  const [commits, setCommits] = useState([]);
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const commitsByAuthors = (
    response,
    githubUsers,
    resBranches,
    branch,
    start = undefined,
    end = undefined
  ) => {
    const [totalCommits, authorsDict, users] = [
      [],
      {},
      Object.keys(githubUsers.data['users']),
    ];

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
            if (user in authorsDict) authorsDict[user]['total'] += 1;
            else authorsDict[user] = { total: 1 };
          }
        });
      }
    });

    Object.values(authorsDict).forEach((elem) => {
      totalCommits.push(elem['total']);
    });

    setCommits([Object.keys(authorsDict), totalCommits]);
  };

  useEffect(() => {
    commitsByAuthors(props.commits, props.users, props.branches, props.branch);
  }, []);

  useEffect(() => {
    commitsByAuthors(
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
        <p>Autores de Commits</p>
        <Plot
          data={[
            {
              type: 'pie',
              labels: commits[0],
              values: commits[1],
              textinfo: 'label+percent',
              textposition: 'inside',
              automargin: true,
            },
          ]}
          layout={{
            width: 655,
            margin: { t: 50, b: 50, l: 0, r: 0 },
            showlegend: false,
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
          }}
          onClick={(event) => {
            setPoint(event.points[0]);
            setOpen(true);
          }}
        />
      </div>
      <Popup open={open} onClose={closeModal}>
        <CommitsAuthorsModal
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

export default CommitsAuthorsGraph;
