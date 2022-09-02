import { useState } from 'react';
import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  commits: any[];
  users: any;
  issues: any[];
  start: string | undefined;
  end: string | undefined;
}

const CommitsIssuesLinkModal = (props: ModalProps) => {
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

  const parseCommits = (
    response,
    githubUsers,
    issuesRaw,
    type,
    start = undefined,
    end = undefined
  ) => {
    const [result, author, users] = [
      [],
      props.point['label'],
      Object.keys(githubUsers.data['users']),
    ];
    let count = 1;

    response.data['commits'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.date >= start && elem.date <= end) ||
        (elem.date >= start && !end) ||
        (elem.date <= end && !start)
      ) {
        users.forEach((user) => {
          if (githubUsers.data['users'][user].indexOf(elem.author) != -1) {
            let commitObj = {};
            if (
              (user == author &&
                type == 'Com Link' &&
                elem.message.includes('#')) ||
              (user == author &&
                type == 'Sem Link' &&
                !elem.message.includes('#'))
            ) {
              commitObj = {
                id: count,
                hash: elem.hash.slice(0, 7),
                message: elem.message,
                date: parseDate(elem.date),
                added: elem.lines_added,
                removed: elem.lines_removed,
                docs: elem.docs ? 'Sim' : 'Não',
              };
              count++;

              if (type == 'Com Link') {
                let index = elem.message.indexOf('#');
                let issueNumber = elem.message
                  .slice(index, index + 3)
                  .trim()
                  .replace(/[/-]/g, '');

                let issueUrl = issuesRaw.data['issues'].find(
                  (issue) => issue.number == issueNumber
                ).url;

                Object.assign(commitObj, { url: issueUrl });
              }

              result.push(commitObj);
            }
          }
        });
      }
    });

    const msg =
      type == 'Com Link'
        ? `Commmits ${type} ~ Cada um leva para a issue correspondente.`
        : `Lista de Commits ${type}.`;
    setCaptionMsg(msg);
    return result;
  };

  const columns = [
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
              parseCommits(
                props.commits,
                props.users,
                props.issues,
                props.point['data']['name'],
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

export default CommitsIssuesLinkModal;
