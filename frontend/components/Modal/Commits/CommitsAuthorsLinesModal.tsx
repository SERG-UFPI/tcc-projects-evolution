import { useState } from 'react';
import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  commits: any[];
  users: any;
  author: string;
  start: string | undefined;
  end: string | undefined;
}

const CommitsAuthorsLinesModal = (props: ModalProps) => {
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
    start = undefined,
    end = undefined
  ) => {
    const [result, date, type, users] = [
      [],
      props.point['label'].replace(/[/-]/g, ''),
      props.point['data']['name'],
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
            if (
              (user == props.author &&
                type == 'Adicionadas' &&
                elem.date == date) ||
              (user == props.author && type == 'Removidas' && elem.date == date)
            ) {
              result.push({
                id: count,
                hash: elem.hash.slice(0, 7),
                message: elem.message,
                date: parseDate(elem.date),
                added: elem.lines_added,
                removed: elem.lines_removed,
                docs: elem.docs ? 'Sim' : 'Não',
              });
              count++;
            }
          }
        });
      }
    });

    if (type == 'Removidas') {
      setCaptionMsg(
        `Total de ${Math.abs(props.point['value'])} Linhas ${
          props.point['data']['name']
        } nesse dia.`
      );
    } else {
      setCaptionMsg(
        `Total de ${props.point['value']} Linhas ${props.point['data']['name']} nesse dia.`
      );
    }

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
          <h1>Usuário: {props.author}</h1>
          <MyTable
            caption={captionMsg}
            data={() =>
              parseCommits(props.commits, props.users, props.start, props.end)
            }
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default CommitsAuthorsLinesModal;
