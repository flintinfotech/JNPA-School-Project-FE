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
  scroll,
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
        // 🛠️ FIX — without this, antd never creates its own internal
        // horizontal scroll region for the header/body. Instead the raw
        // <table> just renders at its full natural (wide) content width,
        // which drags the WHOLE ant-table-wrapper — including the
        // pagination bar rendered below it — along as one oversized
        // block. Any ancestor with overflow-x:auto then has no choice
        // but to scroll that entire oversized block (table + pagination
        // together) as a single unit, so depending on scroll position
        // the pagination controls appear to drift away, merge into the
        // table, or vanish off-screen — worse on browser zoom, since
        // zoom increases how much horizontal space columns need.
        // `scroll={{ x: "max-content" }}` tells antd to scroll ONLY the
        // header/body internally, at a definite width, so the pagination
        // bar underneath always stays the width of the visible card and
        // never moves.
        scroll={scroll ?? { x: "max-content" }}
        pagination={{
          ...pagination,
          showTotal: (total) => `Total: ${total}`,
        }}
        {...rest}
      />
    </div>
  );
}