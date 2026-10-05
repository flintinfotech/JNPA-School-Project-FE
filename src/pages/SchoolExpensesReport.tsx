import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Empty, Input, Modal, Pagination, Row, Select, Spin, message } from "antd";
import {
  DownloadOutlined,
  ExportOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import CommonTable from "../components/commonTable";
import {
  getAllSchoolExpensesReportData,
  reportProductStatus,
  sumReport,
  type SchoolExpenseReportPayload,
  type SchoolExpenseReportProduct,
} from "../services/SchoolExpensesService";
import { buildSchoolExpensesReportPdf } from "../services/SchoolExpensesReportPdf";

interface ReportFilters {
  category?: string;
  productName?: string;
  status?: string;
}

type DateRange = [Dayjs | null, Dayjs | null] | null;

const money = (v?: number | null) =>
  v === null || v === undefined
    ? "-"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const statusColor = (s?: string) => (s === "PAID" ? "green" : s === "PENDING" ? "orange" : "default");

// Payload sent to the report API (empty values are skipped, so it stays {} when nothing is selected):
// {
//   "productName": "Carrom",
//   "category": "Physics Lab Equipment",
//   "range:purchaseDate": { "start": "2026-10-01", "end": "2026-11-04" }
// }
const buildPayload = (filters: ReportFilters, range: DateRange): SchoolExpenseReportPayload => {
  const payload: SchoolExpenseReportPayload = {};
  if (filters.productName?.trim()) payload.productName = filters.productName.trim();
  if (filters.category) payload.category = filters.category;
  if (range?.[0] || range?.[1]) {
    payload["range:purchaseDate"] = {
      ...(range?.[0] ? { start: range[0].format("YYYY-MM-DD") } : {}),
      ...(range?.[1] ? { end: range[1].format("YYYY-MM-DD") } : {}),
    };
  }
  return payload;
};

// Safety net, in case the backend ignores some payload keys: the same filters are re-checked here.
// With a date range selected, only purchases inside it are kept (and products with none are hidden).
const applyClientFilters = (
  products: SchoolExpenseReportProduct[],
  filters: ReportFilters,
  range: DateRange
): SchoolExpenseReportProduct[] => {
  const name = filters.productName?.trim().toLowerCase();
  const from = range?.[0] ? range[0].startOf("day") : null;
  const to = range?.[1] ? range[1].endOf("day") : null;

  return products
    .filter(
      (p) =>
        (!filters.category || p.category === filters.category) &&
        (!name || (p.productName || "").toLowerCase().includes(name))
    )
    .map((p) => {
      if (!from && !to) return p;
      return {
        ...p,
        reportDataDTOList: (p.reportDataDTOList || []).filter((e) => {
          if (!e.purchaseDate) return false;
          const d = dayjs(e.purchaseDate);
          if (from && d.isBefore(from)) return false;
          if (to && d.isAfter(to)) return false;
          return true;
        }),
      };
    })
    .filter((p) => (!from && !to) || (p.reportDataDTOList || []).length > 0)
    .filter((p) => !filters.status || reportProductStatus(p.reportDataDTOList || []) === filters.status);
};

// Switches to the mobile card layout below `breakpoint`px (same idea as Purchase Master)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

export default function SchoolExpensesReport() {
  const isMobile = useIsMobile();
  const [allProducts, setAllProducts] = useState<SchoolExpenseReportProduct[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // typed values (not applied until Search is clicked) + applied values
  const [searchFilters, setSearchFilters] = useState<ReportFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({});

  // From date -> To date (purchase date), sent to the backend on Search and Export Report
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [appliedRange, setAppliedRange] = useState<DateRange>(null);

  // Category dropdown options. Kept in their own state (and only ever added to), because after a
  // filtered search the API returns fewer products and the list would otherwise shrink.
  const [categories, setCategories] = useState<string[]>([]);

  // Export report
  const [exporting, setExporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState("School_Expenses_Report.pdf");

  const rememberCategories = (list: SchoolExpenseReportProduct[]) => {
    setCategories((prev) => {
      const set = new Set(prev);
      list.forEach((p) => p.category && set.add(p.category));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  };

  // ---------- DATA (School Expenses REPORT API, all pages) — called with the payload ----------
  const fetchExpenses = useCallback(async (filters: ReportFilters, range: DateRange) => {
    setTableLoading(true);
    try {
      const list = await getAllSchoolExpensesReportData(buildPayload(filters, range));
      rememberCategories(list);
      setAllProducts(list);
    } catch (error: any) {
      console.error("School expenses report error:", error);
      message.error(error?.response?.data?.message || error?.message || "Failed to load school expenses report");
      setAllProducts([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  // first load: nothing selected -> payload {}
  useEffect(() => {
    fetchExpenses({}, null);
  }, [fetchExpenses]);

  // free the blob URL if the screen is closed while the report is open
  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl);
    };
  }, [reportUrl]);

  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c, value: c })), [categories]);

  // ---------- FILTERED LIST + PAGE SLICE ----------
  const filteredProducts = useMemo(
    () => applyClientFilters(allProducts, appliedFilters, appliedRange),
    [allProducts, appliedFilters, appliedRange]
  );

  const displayedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const handleFilterChange = (field: keyof ReportFilters, value?: string) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  // both dates must be chosen together (or none)
  const rangeIsIncomplete = (range: DateRange) => !!range?.[0] !== !!range?.[1];

  // ---------- SEARCH -> calls the report API with the payload ----------
  const handleSearch = () => {
    if (rangeIsIncomplete(dateRange)) {
      message.warning("Please select both From date and To date");
      return;
    }
    setPage(0);
    setAppliedFilters(searchFilters);
    setAppliedRange(dateRange);
    fetchExpenses(searchFilters, dateRange);
  };

  const handleReset = () => {
    setSearchFilters({});
    setAppliedFilters({});
    setDateRange(null);
    setAppliedRange(null);
    setPage(0);
    fetchExpenses({}, null);
  };

  // ---------- EXPORT REPORT -> calls the report API again with the payload, then builds the PDF ----------
  // Uses whatever is selected/typed in the search bar right now.
  const handleExportReport = async () => {
    if (rangeIsIncomplete(dateRange)) {
      message.warning("Please select both From date and To date");
      return;
    }

    setExporting(true);
    try {
      const fetched = await getAllSchoolExpensesReportData(buildPayload(searchFilters, dateRange));
      rememberCategories(fetched);
      const products = applyClientFilters(fetched, searchFilters, dateRange);

      if (!products.length) {
        message.warning("No data found for the selected filters");
        return;
      }

      const blob = buildSchoolExpensesReportPdf(products, searchFilters);
      setReportFileName(`School_Expenses_Report_${dayjs().format("DD-MM-YYYY")}.pdf`);
      setReportUrl(URL.createObjectURL(blob));
      setReportOpen(true);
    } catch (error: any) {
      console.error("Export report failed:", error);
      message.error(error?.response?.data?.message || error?.message || "Failed to generate report");
    } finally {
      setExporting(false);
    }
  };

  const closeReport = () => {
    setReportOpen(false);
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    setReportUrl(null);
  };

  const downloadReport = () => {
    if (!reportUrl) return;
    const a = document.createElement("a");
    a.href = reportUrl;
    a.download = reportFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ---------- TABLE COLUMNS: Sr No, Category, Product Name, Quantity, Total, Status ----------
  const columns = [
    {
      title: "Sr No",
      key: "srNo",
      width: 80,
      render: (_: any, __: SchoolExpenseReportProduct, index: number) => page * pageSize + index + 1,
    },
    { title: "Category", dataIndex: "category", key: "category", render: (v: string) => v || "-" },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (v: string) => (v || "-").trim(),
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_: any, r: SchoolExpenseReportProduct) => sumReport(r.reportDataDTOList || [], "quantity"),
    },
    {
      title: "Total",
      key: "total",
      render: (_: any, r: SchoolExpenseReportProduct) => `₹ ${money(sumReport(r.reportDataDTOList || [], "total"))}`,
    },
    // {
    //   title: "Status",
    //   key: "status",
    //   render: (_: any, r: SchoolExpenseReportProduct) => {
    //     const st = reportProductStatus(r.reportDataDTOList || []);
    //     return <Tag color={statusColor(st)}>{st}</Tag>;
    //   },
    // },
  ];

  return (
    <div>
      {/* Search Bar */}
      <Row gutter={[12, 12]} style={{ padding: "16px 0" }}>
        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Category"
            value={searchFilters.category}
            onChange={(value) => handleFilterChange("category", value)}
            style={{ width: "100%" }}
            allowClear
            showSearch
            options={categoryOptions}
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <Input
            placeholder="Product Name"
            value={searchFilters.productName}
            onChange={(e) => handleFilterChange("productName", e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>

        {/* From date -> To date (purchase date), sent to the backend */}
        <Col xs={24} sm={12} md={7}>
          <DatePicker.RangePicker
            format="DD-MM-YYYY"
            placeholder={["From Date", "To Date"]}
            value={dateRange as any}
            onChange={(v) => setDateRange(v as DateRange)}
            style={{ width: "100%" }}
            allowClear
          />
        </Col>
{/* 
        <Col xs={24} sm={12} md={5}>
          <Select
            placeholder="Status"
            value={searchFilters.status}
            onChange={(value) => handleFilterChange("status", value)}
            style={{ width: "100%" }}
            allowClear
            options={[
              { label: "PAID", value: "PAID" },
              { label: "PENDING", value: "PENDING" },
            ]}
          />
        </Col> */}

        <Col xs={24} sm={12} md={7}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
            {/* Export Report, right next to Reset */}
            <Button
              icon={<FilePdfOutlined />}
              loading={exporting}
              onClick={handleExportReport}
              style={{ color: "#cf1322", borderColor: "#cf1322" }}
            >
              Export Report
            </Button>
          </div>
        </Col>
      </Row>

      {isMobile ? (
        /* ---------- MOBILE CARDS ---------- */
        tableLoading ? (
          <Card>
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <Spin />
            </div>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <Empty description="No school expenses found" />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {displayedRows.map((r, index) => {
              const entries = r.reportDataDTOList || [];
              return (
                <Card key={r.productCode || `${r.category}-${r.productName}`} size="small" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>Sr No {page * pageSize + index + 1}</div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>{(r.productName || "-").trim()}</div>
                    </div>
                    {/* <Tag color={statusColor(st)} style={{ marginInlineEnd: 0 }}>{st}</Tag> */}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Category</div>
                    <div style={{ fontWeight: 500 }}>{r.category || "-"}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Quantity</div>
                      <div style={{ fontWeight: 500 }}>{sumReport(entries, "quantity")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Total</div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>₹ {money(sumReport(entries, "total"))}</div>
                    </div>
                  </div>
                </Card>
              );
            })}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Pagination
                size="small"
                current={page + 1}
                pageSize={pageSize}
                total={filteredProducts.length}
                showTotal={(t) => `Total: ${t}`}
                onChange={(newPage, newPageSize) => {
                  setPage(newPage - 1);
                  setPageSize(newPageSize);
                }}
              />
            </div>
          </div>
        )
      ) : /* ---------- DESKTOP TABLE ---------- */ !tableLoading && filteredProducts.length === 0 ? (
        <Empty description="No school expenses found" style={{ padding: "40px 0" }} />
      ) : (
        <CommonTable
          data={displayedRows}
          columns={columns}
          loading={tableLoading}
          rowKey={(r: SchoolExpenseReportProduct) => r.productCode || `${r.category}-${r.productName}`}
          pagination={{
            current: page + 1,
            pageSize,
            total: filteredProducts.length,
            onChange: (newPage: number, newPageSize: number) => {
              setPage(newPage - 1);
              setPageSize(newPageSize);
            },
          }}
        />
      )}

      {/* ---------- Report preview (opens when Export Report is clicked) ---------- */}
      <Modal
        title="School Expenses Report"
        open={reportOpen}
        onCancel={closeReport}
        width={isMobile ? "100%" : 900}
        style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0, paddingBottom: 0 } : undefined}
        centered={!isMobile}
        destroyOnHidden
        footer={[
          // Phones (esp. iPhone) show only page 1 inside an iframe, so give a way to open the full PDF
          isMobile && (
            <Button key="open" icon={<ExportOutlined />} onClick={() => reportUrl && window.open(reportUrl, "_blank")}>
              Open
            </Button>
          ),
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadReport}>
            Download PDF
          </Button>,
          <Button key="close" onClick={closeReport}>
            Close
          </Button>,
        ]}
      >
        {reportUrl && (
          <iframe
            title="School Expenses Report"
            src={reportUrl}
            style={{
              width: "100%",
              height: isMobile ? "calc(100vh - 190px)" : "75vh",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
            }}
          />
        )}
      </Modal>
    </div>
  );
}