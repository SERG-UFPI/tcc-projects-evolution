import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from  '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  pullRequests: any[];
  start: string | undefined;
  end: string | undefined;
}

const PullRequestsLifetimeModal = (props: ModalProps) => {
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
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const result = [];
    response.data['pr'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created >= start && elem.created <= end) ||
        (elem.created >= start && !end) ||
        (elem.created <= end && !start)
      ) {
        if (elem.closed) {
          result.push({
            id: elem.id,
            number: elem.number,
            title: elem.title,
            created: parseDate(elem.created),
            closed: parseDate(elem.closed),
            activeDays: elem.active_days,
            merged: elem.was_merged ? 'Sim' : 'Não',
            mergedBy: elem.merged_by,
            url: elem.url,
          });
        }
      }
    });

    return result;
  };

  const columns = [
    {
      label: 'Número',
      accessor: 'number',
      sortable: true,
    },
    { label: 'Título', accessor: 'title', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
    { label: 'Dias Ativos', accessor: 'activeDays', sortable: true },
    { label: 'Merged', accessor: 'merged', sortable: true },
    { label: 'Integrador', accessor: 'mergedBy', sortable: true },
  ];

  return (
    <div className={styles.modalBackground} onClick={() => props.onCloseModal()} >
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={stylesTable.table_container}>
          <h1>Tempo de vida dos Pull Requests</h1>
          <MyTable
            caption=""
            data={() => parsePr(props.pullRequests, props.start, props.end)}
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default PullRequestsLifetimeModal;
