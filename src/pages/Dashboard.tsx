import { useEffect, useState } from "react";
import { Briefcase, UserCheck, Calculator } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  getAllStudentsCount,
  getAllUsersCount,
  getAllAdmissionInquiryCount,
} from "../services/dashboardService";

// ── Stat card (Teacher / Parent / Accountant) ───────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClasses: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, colorClasses, loading }: StatCardProps) {
  return (
    <div className={`relative rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden ${colorClasses}`}>
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-90">
        {icon}
      </div>
      <p className="text-xs sm:text-sm font-medium opacity-90">{label}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-bold">
        {loading ? (
          <span className="inline-block h-7 w-14 sm:h-8 sm:w-16 rounded bg-white/40 animate-pulse" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

// ── Generic donut chart (used for Student Total + Total Inquiry) ──
interface DonutSegment {
  name: string;
  value: number;
}

interface DonutChartProps {
  title: string;
  total: number;
  segments: DonutSegment[];
  colors: string[];
  loading?: boolean;
  emptyLabel?: string;
}

function DonutChart({
  title,
  total,
  segments,
  colors,
  loading,
  emptyLabel = "No data",
}: DonutChartProps) {
  const hasData = total > 0;

  return (
    <div className="rounded-2xl p-4 sm:p-5 shadow-sm bg-white">
      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
        {title}
      </h3>

      {loading ? (
        <div className="h-56 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="h-56 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
          {emptyLabel}
        </div>
      ) : (
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="42%"
                innerRadius="45%"
                outerRadius="65%"
                paddingAngle={2}
              >
                {segments.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div
            className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center"
            style={{ top: "30%", transform: "translateY(-50%)" }}
          >
            <span className="text-xl sm:text-2xl font-bold text-gray-800">
              {total}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">Total</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Standard-wise ordering, matching the real API labels ──
const STANDARD_ORDER = [
  "Playgroup",
  "Nursery",
  "Junior KG (LKG)",
  "Senior KG (UKG)",
  "1st Standard",
  "2nd Standard",
  "3rd Standard",
  "4th Standard",
  "5th Standard",
  "6th Standard",
  "7th Standard",
  "8th Standard",
  "9th Standard",
  "10th Standard",
  "11th Standard",
  "12th Standard",
];

// Handles shorthand variants some data sources might still send
// ("LKG", "UKG", bare "4") by mapping them onto the same order.
const STANDARD_ALIASES: Record<string, string> = {
  PG: "Playgroup",
  LKG: "Junior KG (LKG)",
  UKG: "Senior KG (UKG)",
};

const standardSortIndex = (label: string) => {
  const normalized = STANDARD_ALIASES[label] ?? label;

  const directIdx = STANDARD_ORDER.indexOf(normalized);
  if (directIdx !== -1) return directIdx;

  // Fallback: pull a leading number out of labels like "4" or "4th Standard"
  // and slot it after the 4 pre-numeric entries (Playgroup..Senior KG).
  const numMatch = normalized.match(/\d+/);
  if (numMatch) return 4 + Number(numMatch[0]) - 1;

  // Unknown label: push to the end, alphabetically among unknowns.
  return Number.MAX_SAFE_INTEGER;
};

// Shorter labels for display on the chart axis/tooltip only —
// sorting above still uses the full raw key from the API.
const STANDARD_DISPLAY_LABELS: Record<string, string> = {
  "Junior KG (LKG)": "LKG",
  "Senior KG (UKG)": "UKG",
};

const standardDisplayLabel = (label: string) =>
  STANDARD_DISPLAY_LABELS[label] ?? label;

// ── Bar chart: Total Students, grouped Boys/Girls per standard ──
interface StandardGenderCount {
  boys: number;
  girls: number;
}

interface StandardBarChartProps {
  total: number;
  byStandard: Record<string, StandardGenderCount>;
  male?: number;
  female?: number;
  loading?: boolean;
  emptyLabel?: string;
}

function StandardBarChart({
  total,
  byStandard,
  male = 0,
  female = 0,
  loading,
  emptyLabel = "No data",
}: StandardBarChartProps) {
  const chartData = Object.entries(byStandard)
    .filter(([standard]) => standard !== "Total")
    .sort(([a], [b]) => standardSortIndex(a) - standardSortIndex(b))
    .map(([standard, counts]) => ({
      standard: standardDisplayLabel(standard),
      boys: counts?.boys ?? 0,
      girls: counts?.girls ?? 0,
    }));

  const hasData = chartData.length > 0;
  const hasGenderData = male + female > 0;

  return (
    <div className="rounded-2xl p-4 sm:p-5 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700">
          Total Student
        </h3>
        {!loading && hasData && (
          <span className="text-sm sm:text-base font-bold text-gray-800">
            Total: {total}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-56 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="h-56 sm:h-64 flex items-center justify-center text-gray-400 text-sm">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="standard" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="boys" name="Boys" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="girls" name="Girls" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {hasGenderData && (
            <div className="lg:w-48 flex lg:flex-col items-center justify-center gap-4 lg:gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Boys", value: male },
                        { name: "Girls", value: female },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Boys: {male}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  Girls: {female}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  // ── Students ──────────────────────────────────────────
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsByStandard, setStudentsByStandard] = useState<
    Record<string, { boys: number; girls: number }>
  >({});
  const [studentsMale, setStudentsMale] = useState(0);
  const [studentsFemale, setStudentsFemale] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // ── Users by role (Teacher / Parent / Accountant) ──────
  const [employeesCount, setEmployeesCount] = useState<number | null>(null);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  const [parentsCount, setParentsCount] = useState<number | null>(null);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [parentsError, setParentsError] = useState<string | null>(null);

  const [accountantsCount, setAccountantsCount] = useState<number | null>(null);
  const [accountantsLoading, setAccountantsLoading] = useState(true);
  const [accountantsError, setAccountantsError] = useState<string | null>(null);

  // ── Admission Inquiry ───────────────────────────────────
  const [inquiryTotal, setInquiryTotal] = useState(0);
  const [inquiryNew, setInquiryNew] = useState(0);
  const [inquiryApproved, setInquiryApproved] = useState(0);
  const [inquiryRejected, setInquiryRejected] = useState(0);
  const [inquiryLoading, setInquiryLoading] = useState(true);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStudentsCount = async () => {
      try {
        setStudentsLoading(true);
        setStudentsError(null);

        const res = await getAllStudentsCount();

        if (isMounted) {
          const data = res.data?.data ?? {};
          const totalEntry = data.Total ?? { boys: 0, girls: 0 };
          setStudentsTotal((totalEntry.boys ?? 0) + (totalEntry.girls ?? 0));
          setStudentsMale(totalEntry.boys ?? 0);
          setStudentsFemale(totalEntry.girls ?? 0);
          setStudentsByStandard(data);
        }
      } catch (error) {
        if (isMounted) setStudentsError("Failed to load students count");
      } finally {
        if (isMounted) setStudentsLoading(false);
      }
    };

    const fetchDashboardRoles = async () => {
      try {
        setEmployeesLoading(true);
        setParentsLoading(true);
        setAccountantsLoading(true);

        setEmployeesError(null);
        setParentsError(null);
        setAccountantsError(null);

        const res = await getAllUsersCount();

        if (isMounted) {
          const data = res.data?.data;
          setEmployeesCount(data?.TEACHER ?? 0);
          setParentsCount(data?.PARENT ?? 0);
          setAccountantsCount(data?.ACCOUNTANT ?? 0);
        }
      } catch (error) {
        if (isMounted) {
          setEmployeesError("Failed to load teachers count");
          setParentsError("Failed to load parent count");
          setAccountantsError("Failed to load accountant count");
        }
      } finally {
        if (isMounted) {
          setEmployeesLoading(false);
          setParentsLoading(false);
          setAccountantsLoading(false);
        }
      }
    };

    const fetchInquiryCount = async () => {
      try {
        setInquiryLoading(true);
        setInquiryError(null);

        const res = await getAllAdmissionInquiryCount();

        if (isMounted) {
          const data = res.data?.data;
          setInquiryTotal(data?.Total ?? 0);
          setInquiryNew(data?.NEW ?? 0);
          setInquiryApproved(data?.APPROVED ?? 0);
          setInquiryRejected(data?.REJECTED ?? 0);
        }
      } catch (error) {
        if (isMounted) setInquiryError("Failed to load inquiry count");
      } finally {
        if (isMounted) setInquiryLoading(false);
      }
    };

    fetchStudentsCount();
    fetchDashboardRoles();
    fetchInquiryCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const errors = [
    studentsError,
    employeesError,
    parentsError,
    accountantsError,
    inquiryError,
  ].filter(Boolean);

  return (
    <div className="px-2 sm:px-0">
      {errors.length > 0 && (
        <div className="mb-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-600">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <StatCard
          label="Total Teachers"
          value={employeesCount ?? "-"}
          loading={employeesLoading}
          icon={<Briefcase size={20} />}
          colorClasses="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
        />
        <StatCard
          label="Total Parent"
          value={parentsCount ?? "-"}
          loading={parentsLoading}
          icon={<UserCheck size={20} />}
          colorClasses="bg-gradient-to-br from-orange-400 to-orange-500 text-white"
        />
        <StatCard
          label="Total Accountant"
          value={accountantsCount ?? "-"}
          loading={accountantsLoading}
          icon={<Calculator size={20} />}
          colorClasses="bg-gradient-to-br from-teal-500 to-teal-600 text-white"
        />
      </div>

      {/* Student chart: full width */}
      <div className="mb-3 sm:mb-4">
        <StandardBarChart
          total={studentsTotal}
          byStandard={studentsByStandard}
          male={studentsMale}
          female={studentsFemale}
          loading={studentsLoading}
          emptyLabel="No student data"
        />
      </div>

      {/* Inquiry chart: below, own row */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <DonutChart
          title="Total Inquiry"
          total={inquiryTotal}
          segments={[
            { name: `New (${inquiryNew})`, value: inquiryNew },
            { name:`Approved (${inquiryApproved})`, value: inquiryApproved },
            { name: `Rejected (${inquiryRejected})`, value: inquiryRejected },
          ]}
          colors={["#3b82f6", "#22c55e", "#ef4444"]}
          loading={inquiryLoading}
          emptyLabel="No inquiry data"
        />
      </div>
    </div>
  );
};

export default Dashboard;