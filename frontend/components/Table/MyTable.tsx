import stylesTable from '../../styles/Table.module.css';
import MyTableBody from './MyTableBody';
import MyTableHead from './MyTableHead';
import { useSortableTable } from './useSortableTable';

const Table = ({ caption, data, columns }) => {
  const [tableData, handleSorting] = useSortableTable(data);

  return (
    <>
      <table className={stylesTable.table}>
        <caption>{caption}</caption>
        <MyTableHead {...{ columns, handleSorting }} />
        <MyTableBody {...{ columns, tableData }} />
      </table>
    </>
  );
};

export default Table;
