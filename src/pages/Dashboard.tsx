import { useEffect, useState } from "react";
import { Briefcase, UserCheck, Calculator } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

const Dashboard = () => {
  // ── Students ──────────────────────────────────────────
  const [studentsTotal, setStudentsTotal] = useState(0);
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
          const data = res.data?.data;
          setStudentsTotal(data?.Total ?? 0);
          setStudentsMale(data?.Male ?? 0);
          setStudentsFemale(data?.Female ?? 0);
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

      {/* Donut charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <DonutChart
          title="Total Student "
          total={studentsTotal}
          segments={[
            { name: `Male (${studentsMale})`, value: studentsMale },
            { name: `Female (${studentsFemale})`, value: studentsFemale },
          ]}
          colors={["#3b82f6", "#f97316"]}
          loading={studentsLoading}
          emptyLabel="No student data"
        />

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