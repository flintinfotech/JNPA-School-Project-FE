import { Table } from "antd";
import type { TableProps } from "antd";

interface CommonTableProps<T> extends Omit<TableProps<T>, "dataSource"> {
  data: T[];
}

export default function CommonTable<T extends object>({
  data,
  columns,
  loading,
  rowKey,
  pagination,
  ...rest
}: CommonTableProps<T>) {
  return (
    <div className="table-wrapper">
      <Table<T>
        size="middle"
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey={
          rowKey ??
          ((record: any) =>
            record.id ?? record.userId ?? JSON.stringify(record))
        }
        bordered
        pagination={{
          ...pagination,
          showTotal: (total) => `Total: ${total}`,
        }}
        {...rest}
      />
    </div>
  );
}