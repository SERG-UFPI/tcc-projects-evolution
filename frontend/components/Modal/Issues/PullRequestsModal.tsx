import { useState } from 'react';
import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  pullRequests: any[];
  start: string | undefined;
  end: string | undefined;
}

const PullRequestsModal = (props: ModalProps) => {
  const [tabIndex, setTabIndex] = useState(0);

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

  const parsePr = (response, start = undefined, end = undefined) => {
    const result = [];

    response.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        result.push({
          id: elem.id,
          number: elem.number,
          title: elem.title,
          reviewers: elem.reviewers.toString() ?? '--',
          created: parseDate(elem.created),
          closed: parseDate(elem.closed),
          merged: elem.was_merged ? 'Sim' : 'Não',
          mergedBy: elem.merged_by,
          comments: elem.comments,
          url: elem.url,
        });
      }
    });

    return result;
  };

  const parsePrByType = (response, start = undefined, end = undefined) => {
    const [result, selectLabel] = [[], props.point['label']];

    response.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        if (
          (elem.reviewers.length &&
            elem.comments &&
            selectLabel == 'Revisão e Comentários') ||
          ((!elem.reviewers.length || !elem.comments) &&
            selectLabel == 'Revisão ou Comentários') ||
          (!elem.reviewers.length &&
            !elem.comments &&
            selectLabel == 'Sem revisão e Sem comentários')
        )
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            reviewers: elem.reviewers.toString() ?? '--',
            created: parseDate(elem.created),
            closed: parseDate(elem.closed),
            merged: elem.was_merged ? 'Sim' : 'Não',
            mergedBy: elem.merged_by,
            comments: elem.comments,
            url: elem.url,
          });
      }
    });

    return result;
  };

  const columns = [
    { label: 'Número', accessor: 'number', sortable: true },
    { label: 'Título', accessor: 'title', sortable: true },
    { label: 'Revisores', accessor: 'reviewers', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
    { label: 'Merged', accessor: 'merged', sortable: true },
    { label: 'Integrador', accessor: 'mergedBy', sortable: true },
    { label: 'Comentários', accessor: 'comments', sortable: true },
  ];

  return (
    <div
      className={styles.modalBackground}
      onClick={() => props.onCloseModal()}
    >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={stylesTable.table_container}>
        <div className={stylesTable.tableTitle}>
            <h1
              className={
                tabIndex == 0
                  ? stylesTable.tableTitleSelect
                  : stylesTable.tableTitleNotSelect
              }
              onClick={() => setTabIndex(0)}
            >
              Todas as Pull Requests
            </h1>
            <div className={stylesTable.division}></div>
            <h1
              className={
                tabIndex != 0
                  ? stylesTable.tableTitleSelect
                  : stylesTable.tableTitleNotSelect
              }
              onClick={() => setTabIndex(1)}
            >
              {props.point['label']}
            </h1>
          </div>
          <div
            className={
              tabIndex == 1 ? stylesTable.clearTable : stylesTable.unclearTable
            }
          >
            <MyTable
              caption="Todas as Pull Requests do Repositório."
              data={() => parsePr(props.pullRequests, props.start, props.end)}
              columns={columns}
            />
          </div>
          <div
            className={
              tabIndex != 1 ? stylesTable.clearTable : stylesTable.unclearTable
            }
          >
            <MyTable
              caption=""
              data={() =>
                parsePrByType(props.pullRequests, props.start, props.end)
              }
              columns={columns}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequestsModal;
