import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

interface TypeContributionProps {
  issuesAuthors: any[];
  pullRequests: any[];
  metrics: any[];
  start: string | undefined;
  end: string | undefined;
}

const TypeContributionGraph = (props: TypeContributionProps) => {
  const [issues, setIssues] = useState<any>([]);
  const [comments, setComments] = useState([]);
  const [integration, setIntegration] = useState([]);
  const [commits, setCommits] = useState([]);
  const [docs, setDocs] = useState([]);

  const sortObject = (obj) => {
    obj = Object.keys(obj)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

    return [Object.keys(obj), Object.values(obj)];
  };

  const countOccurrences = (obj, arr) => {
    Object.keys(obj).forEach((key) => {
      obj[key] = arr.filter((x) => x == key).length;
    });
  };

  const makeObjectsWithSameField = (arr) => {
    let maxLength = 0;
    let maxIndex = 0;

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

  const typeOfContribution = (
    res_issues,
    res_pr,
    res_commit,
    start = undefined,
    end = undefined
  ) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    let resultIssues = [];
    let issuesAuthors = {};
    res_issues.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      ) {
        elem['creator'] in issuesAuthors
          ? issuesAuthors[elem.creator]++
          : (issuesAuthors[elem.creator] = 1);
      }
    });
    resultIssues.push(issuesAuthors);

    const [countComments, countMerges] = [[], []];
    let [prCommentsAuthors, integrationAuthors] = [{}, {}];
    res_pr.data['pr'].forEach((elem) => {
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

    resultIssues.push(prCommentsAuthors);
    resultIssues.push(integrationAuthors);

    makeObjectsWithSameField(resultIssues);

    setIssues(sortObject(issuesAuthors));
    setComments(sortObject(prCommentsAuthors));
    setIntegration(sortObject(integrationAuthors));

    // ^^^ Relacionado ao Github (Issues || Comentários)
    // ##########################################
    // vvv Relacionado ao Git (Commits || Documentação)

    const [totalCommits, totalDocs] = [[], []];
    let [commitsIdentifier, authorsDict] = [{}, {}];
    res_commit.data['metrics'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        if (!(elem.identifier in commitsIdentifier)) {
          authorsDict[elem.identifier] = elem.author;
          commitsIdentifier[elem.identifier] = { total: 1 };
          commitsIdentifier[elem.identifier].totalDocs = elem.docs ? 1 : 0;
        } else {
          commitsIdentifier[elem.identifier]['total'] += 1;
          if (elem.docs) commitsIdentifier[elem.identifier].totalDocs += 1;
        }
      }
    });

    const aux = Object.keys(commitsIdentifier);
    const values = Object.values(commitsIdentifier);

    values.forEach((value) => {
      totalCommits.push(value['total']);
      totalDocs.push(value['totalDocs']);
    });

    const [labels, newResultCommits, newResultDocs] = [[], [], []];
    aux.forEach((identifier) => {
      labels.push(authorsDict[identifier]);
    });
    
    let count = 0;
    aux.forEach((identifier) => {
      if (labels.indexOf(authorsDict[identifier]) != -1) {
        let index = labels.indexOf(authorsDict[identifier]);
        let identifierIndex = aux.indexOf(identifier);
        newResultCommits[index] = totalCommits[index] + totalCommits[identifierIndex];
        newResultDocs[index] = totalDocs[index] + totalDocs[identifierIndex];
      } else {
        newResultCommits.push(totalCommits[count]);
        newResultDocs.push(totalDocs[count]);
      }
      labels.push(authorsDict[identifier]);
      count++;
    });

    setCommits([labels, newResultCommits]);
    setDocs([labels, newResultDocs]);
  };

  useEffect(() => {
    typeOfContribution(props.issuesAuthors, props.pullRequests, props.metrics);
  }, []);

  useEffect(() => {
    typeOfContribution(
      props.issuesAuthors,
      props.pullRequests,
      props.metrics,
      props.start,
      props.end
    );
  }, [props.start, props.end]);

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
        />
      </div>
    </>
  );
};

export default TypeContributionGraph;
