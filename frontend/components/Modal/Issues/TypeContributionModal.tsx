import { useState } from 'react';
import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  issues: any[];
  pullRequests: any[];
  commits: any[];
  users: any;
  start: string | undefined;
  end: string | undefined;
}

const TypeContributionModal = (props: ModalProps) => {
  const [columns, setColumns] = useState([]);
  const [captionMsg, setCaptionMsg] = useState('');

  const parseDate = (date) => {
    if (date.length == 8) {
      return date.slice(6, 8) + '/' + date.slice(4, 6) + '/' + date.slice(0, 4);
    } else {
      return (
        date.match(/\d+/g)[2] +
        '/' +
        date.match(/\d+/g)[1] +
        '/' +
        date.match(/\d+/g)[0]
      );
    }
  };

  const parseContributions = (
    issuesRaw,
    pullRequestsRaw,
    commitsRaw,
    githubUsers,
    start = undefined,
    end = undefined
  ) => {
    const [contribuitor, typeOfContribution] = [
      props.point['label'],
      props.point['data']['name'],
    ];

    if (typeOfContribution == 'Issues') {
      setColumns(issuesColumns());
      setCaptionMsg(`Issues criadas pelo usuário.`);
      return parseIssues(issuesRaw, contribuitor, start, end);
    } else if (typeOfContribution == 'Comentários') {
      setColumns(commentsColumns());
      setCaptionMsg(
        `Comentários realizados pelo usuário em issues ou pull requests.`
      );
      return parseComments(
        issuesRaw,
        pullRequestsRaw,
        contribuitor,
        start,
        end
      );
    } else if (typeOfContribution == 'Integração') {
      setColumns(prColumns());
      setCaptionMsg(`Pull Requests aprovados pelo usuário.`);
      return parsePullRequests(pullRequestsRaw, contribuitor, start, end);
    } else {
      typeOfContribution == 'Commits'
        ? setCaptionMsg(`Todos os commits realizados pelo usuário.`)
        : setCaptionMsg(`Commits que afetaram a documentação.`);

      setColumns(commitsColumns());
      return parseCommits(
        commitsRaw,
        githubUsers,
        contribuitor,
        typeOfContribution,
        start,
        end
      );
    }
  };

  const parseIssues = (resIssues, contribuitor, start, end) => {
    const result = [];
    resIssues.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      ) {
        if (elem.creator == contribuitor) {
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            assignees: elem.assignees.toString(),
            comments: elem.comments,
            state: elem.state,
            created: parseDate(elem.created_at),
            closed: elem.closed_at ? parseDate(elem.closed_at) : '',
            url: elem.url,
          });
        }
      }
    });

    return result;
  };

  const issuesColumns = () => [
    { label: 'Número', accessor: 'number', sortable: true },
    { label: 'Título ~ Issue', accessor: 'title', sortable: true },
    { label: 'Encarregado(s)', accessor: 'assignees', sortable: true },
    { label: 'Comentários', accessor: 'comments', sortable: true },
    { label: 'Estado', accessor: 'state', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
  ];

  const parseComments = (resIssues, resPr, contribuitor, start, end) => {
    const result = [];

    resIssues.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      ) {
        if (
          elem.comments > 0 &&
          Object.keys(elem.comments_authors).indexOf(contribuitor) != -1
        ) {
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            state: elem.state,
            comments: elem.comments,
            created: parseDate(elem.created_at),
            closed: elem.closed_at ? parseDate(elem.closed_at) : '',
            activeDays: elem.active_days,
            type: 'Issue',
            url: elem.url,
          });
        }
      }
    });

    resPr.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        if (elem.comments > 0 && elem.creator == contribuitor) {
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            state: elem.was_merged ? 'Merged' : 'Not Merged',
            comments: elem.comments,
            created: parseDate(elem.created),
            closed: elem.closed ? parseDate(elem.closed) : '',
            activeDays: elem.active_days,
            type: 'Pull Request',
            url: elem.url,
          });
        }
      }
    });

    return result;
  };

  const commentsColumns = () => [
    { label: 'Número', accessor: 'number', sortable: true },
    { label: 'Tipo', accessor: 'type', sortable: true },
    { label: 'Título', accessor: 'title', sortable: true },
    { label: 'Estado', accessor: 'state', sortable: true },
    { label: 'Comentários', accessor: 'comments', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
    { label: 'Dias Ativos', accessor: 'activeDays', sortable: true },
  ];

  const parsePullRequests = (resPr, contribuitor, start, end) => {
    const result = [];

    resPr.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        if (contribuitor == elem.merged_by) {
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            creator: elem.creator,
            reviewers: elem.reviewers.toString(),
            created: parseDate(elem.created),
            closed: elem.closed ? parseDate(elem.closed) : '',
            merged: elem.was_merged ? 'Sim' : 'Não',
            mergedBy: elem.merged_by,
            comments: elem.comments,
            url: elem.url,
          });
        }
      }
    });

    return result;
  };

  const prColumns = () => [
    { label: 'Número', accessor: 'number', sortable: true },
    { label: 'Título ~ Pull Request', accessor: 'title', sortable: true },
    { label: 'Criador', accessor: 'creator', sortable: true },
    { label: 'Revisores', accessor: 'reviewers', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
    { label: 'Merged', accessor: 'merged', sortable: true },
    { label: 'Integrador', accessor: 'mergedBy', sortable: true },
    { label: 'Comentários', accessor: 'comments', sortable: true },
  ];

  const parseCommits = (
    resCommits,
    githubUsers,
    contribuitor,
    typeOfContribution,
    start,
    end
  ) => {
    const [result, users] = [[], Object.keys(githubUsers.data['users'])];
    let count = 1;

    resCommits.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        users.forEach((user) => {
          if (githubUsers.data['users'][user].indexOf(elem.author) != -1) {
            if (
              (user == contribuitor && typeOfContribution == 'Commits') ||
              (user == contribuitor &&
                typeOfContribution == 'Documentação' &&
                elem.docs)
            ) {
              result.push({
                id: count,
                hash: elem.hash.slice(0, 7),
                message: elem.message,
                date: parseDate(elem.date),
                added: elem.lines_added,
                removed: elem.lines_removed,
                docs: elem.docs ? 'Sim' : 'Não',
                url: elem.url,
              });
              count++;
            }
          }
        });
      }
    });

    return result;
  };

  const commitsColumns = () => [
    { label: 'Hash', accessor: 'hash', sortable: true },
    { label: 'Mensagem', accessor: 'message', sortable: true },
    { label: 'Data_Commit', accessor: 'date', sortable: true },
    { label: 'Linhas Adicionadas', accessor: 'added', sortable: true },
    { label: 'Linhas Removidas', accessor: 'removed', sortable: true },
    { label: 'Alteração na Documentação', accessor: 'docs', sortable: true },
  ];

  return (
    <div
      className={styles.modalBackground}
      onClick={() => props.onCloseModal()}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={stylesTable.table_container}>
          <h1>Usuário: {props.point['label']}</h1>
          <MyTable
            caption={captionMsg}
            data={() =>
              parseContributions(
                props.issues,
                props.pullRequests,
                props.commits,
                props.users,
                props.start,
                props.end
              )
            }
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default TypeContributionModal;
