const MyTableBody = ({ tableData, columns }) => {
  return (
    <tbody>
      {tableData.map((data) => {
        return (
          <tr
            key={data.id}
            onClick={() => {
              window.open(data.url, '_blank');
            }}
          >
            {columns.map(({ accessor }) => {
              const tData = data[accessor] ?? '--';
              return <td key={accessor}>{tData}</td>;
            })}
          </tr>
        );
      })}
    </tbody>
  );
};

export default MyTableBody;
