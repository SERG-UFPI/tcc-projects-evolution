import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';
import styles from '../../styles/Home.module.css';
import TypeContributionModal from '../Modal/Issues/TypeContributionModal';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface TypeContributionProps {
  issues: any[];
  pullRequests: any[];
  commits: any[];
  users: any;
  branches: any[];
  branch: string | undefined;
  start: string | undefined;
  end: string | undefined;
}

const TypeContributionGraph = (props: TypeContributionProps) => {
  const [issues, setIssues] = useState<any>([]);
  const [comments, setComments] = useState([]);
  const [integration, setIntegration] = useState([]);
  const [commits, setCommits] = useState([]);
  const [docs, setDocs] = useState([]);
  const [point, setPoint] = useState({});
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);

  const sortObject = (obj) => {
    obj = Object.keys(obj)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

    return [Object.keys(obj), Object.values(obj)];
  };

  const sumObjects = (arr, key) => {
    return arr.reduce((a, b) => a + (b[key] || 0), 0);
  };

  const countOccurrences = (obj, arr) => {
    Object.keys(obj).forEach((key) => {
      obj[key] = arr.filter((x) => x == key).length;
    });
  };

  const makeObjectsWithSameField = (arr) => {
    let [maxLength, maxIndex] = [0, 0];

    arr.forEach((elem) => {
      if (Object.keys(elem).length > maxLength) {
        maxLength = Object.keys(elem).length;
        maxIndex = arr.indexOf(elem);
      }
    });

    const aux = arr.splice(maxIndex, 1);
    Object.keys(aux[0]).forEach((elem) => {
      arr.forEach((obj) => {
        if (Object.keys(obj).indexOf(elem) == -1) obj[elem] = 0;
      });
    });

    arr.splice(maxIndex, 0, aux[0]);

    return [];
  };

  const unifyObjects = (arr) => {
    let [highestLength, highestItem] = [0, 0];

    for (let i = 0; i < arr.length; i++) {
      let objLength = Object.keys(arr[i]).length;
      if (objLength > highestLength) {
        highestLength = objLength;
        highestItem = i;
      }
    }

    const authorsResult = {};
    Object.keys(arr[highestItem]).forEach((author) => {
      authorsResult[author] = sumObjects(arr, author);
    });

    return authorsResult;
  };

  const typeOfContribution = (
    resIssues,
    resPr,
    resCommit,
    usersData,
    resBranches,
    branch,
    start = undefined,
    end = undefined
  ) => {
    const [resultIssues, countIssuesComments] = [[], []];
    let [issuesAuthors, issuesCommentsAuthors] = [{}, {}];
    resIssues.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      ) {
        elem['creator'] in issuesAuthors
          ? issuesAuthors[elem.creator]++
          : (issuesAuthors[elem.creator] = 1);

        if (elem.comments_authors) {
          Object.keys(elem.comments_authors).forEach((author) => {
            countIssuesComments.push(author);
          });
        }
      }
    });
    countOccurrences(issuesCommentsAuthors, countIssuesComments);

    resultIssues.push(issuesAuthors);

    const [countComments, countMerges] = [[], []];
    let [prCommentsAuthors, integrationAuthors] = [{}, {}];
    resPr.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        if (elem.comments_authors) {
          Object.keys(elem.comments_authors).forEach((author) => {
            countComments.push(author);
          });
        }

        if (elem.was_merged) {
          if (!(elem.merged_by in integrationAuthors)) {
            integrationAuthors[elem.merged_by] = 0;
          }
          countMerges.push(elem.merged_by);
        }

        if (elem.reviewers)
          elem.reviewers.forEach((reviewer) => {
            if (!(reviewer in prCommentsAuthors))
              prCommentsAuthors[reviewer] = 0;
          });
        else if (!(elem.creator in prCommentsAuthors))
          prCommentsAuthors[elem.creator] = 0;
      }
    });
    countOccurrences(prCommentsAuthors, countComments);
    countOccurrences(integrationAuthors, countMerges);

    const commentAuthorsResult = unifyObjects([
      issuesCommentsAuthors,
      prCommentsAuthors,
    ]);

    resultIssues.push(commentAuthorsResult);
    resultIssues.push(integrationAuthors);

    makeObjectsWithSameField(resultIssues);

    setIssues(sortObject(issuesAuthors));
    setComments(sortObject(prCommentsAuthors));
    setIntegration(sortObject(integrationAuthors));

    // ^^^ Relacionado ao Github (Issues || Comentários)
    // ##########################################
    // vvv Relacionado ao Git (Commits || Documentação)

    const [totalCommits, totalDocs, githubUsers] = [
      [],
      [],
      Object.keys(usersData.data['users']),
    ];

    let authorsDict = {};

    const principalBranch = Object.keys(resBranches.data['branches']).includes(
      'main'
    )
      ? 'main'
      : 'master';

    let result = branch
      ? resCommit.data['commits'].filter((el) =>
          resBranches.data['branches'][branch].includes(el.hash)
        )
      : resCommit.data['commits'].filter((el) =>
          resBranches.data['branches'][principalBranch].includes(el.hash)
        );

    result.forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        githubUsers.forEach((user) => {
          if (usersData.data['users'][user].indexOf(elem.author) != -1) {
            if (user in authorsDict) {
              authorsDict[user]['total'] += 1;
              if (elem.docs) authorsDict[user]['totalDocs'] += 1;
            } else {
              authorsDict[user] = { total: 1 };
              authorsDict[user].totalDocs = elem.docs ? 1 : 0;
            }
          }
        });
      }
    });

    Object.values(authorsDict).forEach((elem) => {
      totalCommits.push(elem['total']);
      totalDocs.push(elem['totalDocs']);
    });

    setCommits([Object.keys(authorsDict), totalCommits]);
    setDocs([Object.keys(authorsDict), totalDocs]);
  };

  useEffect(() => {
    typeOfContribution(
      props.issues,
      props.pullRequests,
      props.commits,
      props.users,
      props.branches,
      props.branch
    );
  }, []);

  useEffect(() => {
    typeOfContribution(
      props.issues,
      props.pullRequests,
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
              x: issues[0],
              y: issues[1],
              name: 'Issues',
              type: 'bar',
            },
            {
              x: comments[0],
              y: comments[1],
              name: 'Comentários',
              type: 'bar',
            },
            {
              x: integration[0],
              y: integration[1],
              name: 'Integração',
              type: 'bar',
            },
            {
              x: commits[0],
              y: commits[1],
              name: 'Commits',
              type: 'bar',
            },
            {
              x: docs[0],
              y: docs[1],
              name: 'Documentação',
              type: 'bar',
            },
          ]}
          layout={{
            barmode: 'stack',
            title: 'Tipos de Contribuição',
            font: {
              family: 'Arial, sans-serif',
              color: '#111111',
            },
            yaxis: {
              title: 'Quantidade',
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
        <TypeContributionModal
          onCloseModal={closeModal}
          point={point}
          issues={props.issues}
          pullRequests={props.pullRequests}
          commits={props.commits}
          users={props.users}
          start={props.start}
          end={props.end}
        />
      </Popup>
    </>
  );
};

export default TypeContributionGraph;
