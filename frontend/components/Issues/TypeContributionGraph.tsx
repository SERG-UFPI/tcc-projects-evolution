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

  const removeDuplicates = (arr) => {
    const result = [];

    arr.forEach((el) => {
      if (!(el in result)) result.push(el);
    });

    result.sort();
    return result;
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
    console.log(issuesAuthors);
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

        if (elem.reviewers)
          elem.reviewers.forEach((reviewer) => {
            if (!(reviewer in prCommentsAuthors)) {
              prCommentsAuthors[reviewer] = 0;
              integrationAuthors[reviewer] = 0;
            }
          });
        else if (!(elem.creator in prCommentsAuthors))
          prCommentsAuthors[elem.creator] = 0;

        if (elem.was_merged) countMerges.push(elem.merged_by);
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

    /* const totalCommits = [];
    const totalDocs = [];
    res_commit.data['metrics'][1].forEach((elem) => {
      totalCommits.push(elem.total);
      totalDocs.push(elem.total_docs);
    });

    setCommits([res_commit.data['metrics'][0], totalCommits]);
    setDocs([res_commit.data['metrics'][0], totalDocs]); */
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
            /* {
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
            }, */
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
