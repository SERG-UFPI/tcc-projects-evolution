import styles from '../../../styles/Modal.module.css';
import stylesTable from '../../../styles/Table.module.css';
import MyTable from '../../Table/MyTable';

interface ModalProps {
  onCloseModal: Function;
  point: object;
  issues: any[];
  start: string | undefined;
  end: string | undefined;
}

const IssuesAuthorsModal = (props: ModalProps) => {
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

  const parseIssues = (response, start = undefined, end = undefined) => {
    if (start == '') start = undefined;
    if (end == '') end = undefined;

    const result = [];
    const issueCreator = props.point['label'];
    response.data['issues'].forEach((elem) => {
      if (
        (!start && !end) ||
        (elem.created_at >= start && elem.created_at <= end) ||
        (elem.created_at >= start && !end) ||
        (elem.created_at <= end && !start)
      ) {
        if (elem.creator == issueCreator) {
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

  const columns = [
    { label: 'Número', accessor: 'number', sortable: true },
    { label: 'Título', accessor: 'title', sortable: true },
    { label: 'Encarregado(s)', accessor: 'assignees', sortable: true },
    { label: 'Estado', accessor: 'state', sortable: true },
    { label: 'Data_Criação', accessor: 'created', sortable: true },
    { label: 'Data_Fechamento', accessor: 'closed', sortable: true },
    { label: 'Comentários', accessor: 'comments', sortable: true },
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
            caption="Issues criadas pelo usuário acima."
            data={() => parseIssues(props.issues, props.start, props.end)}
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default IssuesAuthorsModal;
