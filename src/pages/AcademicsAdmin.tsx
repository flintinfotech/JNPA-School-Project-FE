import { useEffect, useRef, useState } from "react";
import {
  Form,
  Tabs,
  Input,
  Button,
  Space,
  Divider,
  message,
  Select,
  Spin,
  DatePicker,
  Radio,
  Card,
  Row,
  Col,
  Typography,
  Upload,
} from "antd";
import { PlusOutlined, MinusCircleOutlined, UploadOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";

import {
  saveAcademicYear,
  updateAcademicYear,
  getAllAcademicYears,
  type SubScreenDTO,
  type AcademicYearDTO,
} from "../services/AcademicYearsService"; // adjust path to match your project structure
import {
  saveClassRoom,
  updateClassRoom,
  getAllClassRooms,
} from "../services/ClassroomService"; // adjust path to match your project structure

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text } = Typography;


// Reusable responsive spans: full width on mobile (xs), multi-column from md/lg up.
const HALF_COL = { xs: 24, md: 12 };
const QUARTER_COL = { xs: 24, sm: 12, lg: 6 };

// Converts a File to a raw base64 string (strips the "data:...;base64," prefix,
// since ClassRoomDTO.brochure / subjectData expect the raw base64 payload only).
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = (err) => reject(err);
  });

// Decodes a base64 string into raw bytes. Shared by every place that needs to
// rebuild a Blob/preview from a stored base64 payload.
const base64ToByteArray = (base64: string): Uint8Array => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
};

// The backend only stores raw base64 - no MIME type, no filename - so on
// reload we have no way to know what kind of file it is unless we sniff it
// ourselves from the file's binary signature ("magic numbers"). Without this,
// `new Blob([bytes])` gets an empty type, and opening it just dumps the raw
// bytes as text in the new tab.
const detectMimeType = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.startsWith("25504446")) return "application/pdf"; // %PDF
  if (hex.startsWith("89504e47")) return "image/png"; // \x89PNG
  if (hex.startsWith("ffd8ff")) return "image/jpeg"; // JPEG SOI marker
  if (hex.startsWith("47494638")) return "image/gif"; // GIF87a / GIF89a
  if (hex.startsWith("504b0304")) {
    // Zip-based Office formats (xlsx/docx/pptx) all share this signature -
    // xlsx is the only one relevant here.
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
};

const extensionForMime = (mime: string): string => {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    default:
      return "bin";
  }
};

// Rebuilds a previewable object URL + antd UploadFile entry from a stored
// base64 string, with the correct MIME type sniffed in so the browser
// actually renders it (PDF viewer / image) instead of showing raw bytes.
const buildUploadFileFromBase64 = (base64: string, uid: string, baseName: string): UploadFile => {
  const byteArray = base64ToByteArray(base64);
  const mimeType = detectMimeType(byteArray);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return {
    uid,
    name: `${baseName}.${extensionForMime(mimeType)}`,
    status: "done",
    url,
  } as UploadFile;
};

// const PAGE_SIZE = 10;

export default function AcademicsForm() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Tabs defaultActiveKey="stats" size="large" destroyInactiveTabPane>
        {/* <TabPane tab="Top Stats Strip" key="stats">
          <AcademicYearSection />
        </TabPane> */}
        <TabPane tab="Pre-Primary" key="prePrimary">
          <ClassRoomSection classRoomName="Pre-Primary" title="Pre-Primary" />
        </TabPane>

        <TabPane tab="Primary" key="primary">
          <ClassRoomSection classRoomName="Primary" title="Primary" />
        </TabPane>

        <TabPane tab="Secondary" key="secondary">
          <ClassRoomSection classRoomName="Secondary" title="Secondary" />
        </TabPane>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top Stats Strip — backed by AcademicYearDTO.                       */
/* Existing single-record form UI is untouched. Data now comes from    */
/* getAllAcademicYears instead of getAcademicYearById/localStorage;    */
/* Previous/Next navigate through the fetched records one at a time,   */
/* transparently fetching the next/previous page of 10 as needed.      */
/* ------------------------------------------------------------------ */
//Commented For reason
// function AcademicYearSection() {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [academicYearId, setAcademicYearId] = useState<number | undefined>();

//   // Holds the current page of fetched records plus where we are within it.
//   const [records, setRecords] = useState<AcademicYearDTO[]>([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(0); // 0-indexed, matches the API's page param
//   const [currentIndex, setCurrentIndex] = useState(0); // index within `records`

//   // Tracks the Upload fileList shown for each Achievements "Add Data" entry,
//   // keyed by `${subScreenFieldKey}_${dataEntityFieldKey}`.
//   const [achievementFileLists, setAchievementFileLists] = useState<Record<string, UploadFile[]>>({});

//   // Guards against React StrictMode's intentional double-invoke of effects
//   // in development, which was causing the API to fire twice on mount.
//   const hasFetchedRef = useRef(false);

//   // Holds the real DB ids for existing sub-screens/entities, indexed by
//   // array position. antd's nested Form.List + hidden fields proved
//   // unreliable for carrying these ids through to submit, so we track them
//   // here instead and re-attach them by index in handleFinish.
//   const subScreenIdsRef = useRef<
//     {
//       subScreenId?: number;
//       academicYearId?: number;
//       entities: { subScreenDataId?: number; subScreenId?: number }[];
//     }[]
//   >([]);

//   const loadRecordIntoForm = (record: AcademicYearDTO) => {
//     setAcademicYearId(record.academicYearId);
//     form.setFieldsValue({
//       ...record,
//       startDate: record.startDate ? dayjs(record.startDate) : undefined,
//       endDate: record.endDate ? dayjs(record.endDate) : undefined,
//       subScreenDTOS: record.subScreenDTOS ?? [],
//     });

//     // Keep the real ids out of the form entirely — track them by
//     // position here so they can't get lost to any Form.List quirk.
//     subScreenIdsRef.current = (record.subScreenDTOS ?? []).map((sc: any) => ({
//       subScreenId: sc.subScreenId,
//       academicYearId: sc.academicYearId,
//       entities: (sc.subScreenDataEntities ?? []).map((d: any) => ({
//         subScreenDataId: d.subScreenDataId,
//         subScreenId: d.subScreenId,
//       })),
//     }));

//     const initialFileLists: Record<string, UploadFile[]> = {};
//     (record.subScreenDTOS ?? []).forEach((sc: any, scIdx: number) => {
//       (sc.subScreenDataEntities ?? []).forEach((entity: any, dIdx: number) => {
//         if (entity.subjectData) {
//           initialFileLists[`${scIdx}_${dIdx}`] = [
//             buildUploadFileFromBase64(
//               entity.subjectData,
//               `${scIdx}-${dIdx}`,
//               entity.subjectName ? `${entity.subjectName} - file` : "file"
//             ),
//           ];
//         }
//       });
//     });
//     setAchievementFileLists(initialFileLists);
//   };

//   const handleAddNew = () => {
//     setAcademicYearId(undefined);
//     form.resetFields();
//     subScreenIdsRef.current = [];
//     setAchievementFileLists({});
//   };

//   // Fetches one page of records and shows the record at `indexToShow`
//   // ("last" = last record of that page, used when paging backwards).
//   const fetchPage = (pageIndex: number, indexToShow: number | "last" = 0) => {
//     setLoading(true);
//     getAllAcademicYears(pageIndex, PAGE_SIZE)
//       .then((res) => {
//         const payload: any = res.data.data;
//         // NOTE: the backend's list response uses the key "Date" (not "Data")
//         // for the array of records - matched exactly as returned, with a
//         // defensive fallback to "Data" in case that gets corrected later.
//         const rows: AcademicYearDTO[] = payload?.Date ?? payload?.Data ?? [];
//         const totalCount: number = payload?.Total ?? rows.length;
//         const idx = indexToShow === "last" ? Math.max(rows.length - 1, 0) : indexToShow;

//         setRecords(rows);
//         setTotal(totalCount);
//         setPage(pageIndex);
//         setCurrentIndex(idx);

//         if (rows[idx]) {
//           loadRecordIntoForm(rows[idx]);
//         } else {
//           handleAddNew();
//         }
//       })
//       .catch(() => message.error("Failed to load academic years"))
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => {
//     if (hasFetchedRef.current) return;
//     hasFetchedRef.current = true;
//     fetchPage(0, 0);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const overallIndex = page * PAGE_SIZE + currentIndex;
//   const isFirst = overallIndex <= 0;
//   const isLast = total === 0 || overallIndex >= total - 1;

//   const handlePrevious = () => {
//     if (currentIndex > 0) {
//       const newIndex = currentIndex - 1;
//       setCurrentIndex(newIndex);
//       loadRecordIntoForm(records[newIndex]);
//     } else if (page > 0) {
//       fetchPage(page - 1, "last");
//     }
//   };

//   const handleNext = () => {
//     if (currentIndex < records.length - 1) {
//       const newIndex = currentIndex + 1;
//       setCurrentIndex(newIndex);
//       loadRecordIntoForm(records[newIndex]);
//     } else if ((page + 1) * PAGE_SIZE < total) {
//       fetchPage(page + 1, 0);
//     }
//   };

//   const handleFinish = async (values: any) => {
//     setSaving(true);
//     const subScreenDTOS: SubScreenDTO[] = (values.subScreenDTOS || []).map((sc: any, scIdx: number) => {
//       const origSc = subScreenIdsRef.current[scIdx];
//       return {
//         ...(origSc?.subScreenId ? { subScreenId: origSc.subScreenId } : {}),
//         ...(academicYearId ? { academicYearId } : {}),
//         subScreenName: sc.subScreenName,
//         subScreenDataEntities: (sc.subScreenDataEntities || []).map((d: any, dIdx: number) => {
//           const origEntity = origSc?.entities?.[dIdx];
//           return {
//             ...(origEntity?.subScreenDataId ? { subScreenDataId: origEntity.subScreenDataId } : {}),
//             ...(origEntity?.subScreenId ? { subScreenId: origEntity.subScreenId } : {}),
//             subjectName: d.subjectName,
//             subjectData: d.subjectData ?? null,
//           };
//         }),
//       };
//     });
//     const payload = {
//       academicYearName: values.academicYearName,
//       startDate: dayjs(values.startDate).format("YYYY-MM-DD"),
//       endDate: dayjs(values.endDate).format("YYYY-MM-DD"),
//       isCurrent: values.isCurrent,
//       cbseAffiliated: values.cbseAffiliated,
//       avgPassingPercentage: values.avgPassingPercentage,
//       subjectOffered: values.subjectOffered,
//       studentTeacherRatio: values.studentTeacherRatio,
//       subScreenDTOS,
//     };
//     try {
//       if (academicYearId) {
//         const res = await updateAcademicYear({ ...payload, academicYearId });
//         setAcademicYearId(res.data.data.academicYearId);
//       } else {
//         const res = await saveAcademicYear(payload);
//         setAcademicYearId(res.data.data.academicYearId);
//       }
//       message.success("Academic year details saved");
//       // Refresh the currently displayed page so the record shown reflects
//       // what was just saved.
//       fetchPage(page, currentIndex);
//     } catch {
//       message.error("Failed to save academic year details");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleAchievementFileChange = async (
//     scFieldName: number,
//     dataFieldName: number,
//     entryKey: string,
//     info: { fileList: UploadFile[] }
//   ) => {
//     const file = info.fileList[info.fileList.length - 1];

//     if (!file) {
//       setAchievementFileLists((prev) => ({ ...prev, [entryKey]: [] }));
//       form.setFieldValue(
//         ["subScreenDTOS", scFieldName, "subScreenDataEntities", dataFieldName, "subjectData"],
//         null
//       );
//       return;
//     }

//     if (file.originFileObj) {
//       const base64 = await fileToBase64(file.originFileObj as File);
//       form.setFieldValue(
//         ["subScreenDTOS", scFieldName, "subScreenDataEntities", dataFieldName, "subjectData"],
//         base64
//       );
//       // Fresh upload: the browser already knows the real type, so use it
//       // directly instead of sniffing.
//       file.url = URL.createObjectURL(file.originFileObj as File);
//     }

//     setAchievementFileLists((prev) => ({ ...prev, [entryKey]: [file] }));
//   };

//   if (loading) {
//     return (
//       <div style={{ padding: 60, textAlign: "center" }}>
//         <Spin tip="Loading academic year details..." />
//       </div>
//     );
//   }

//   return (
//     <Form form={form} layout="vertical" onFinish={handleFinish}>
//       {/* Record navigator - shows records one at a time, paging past 10 as needed */}
//       <div
//         style={{
//           display: "flex",
//           flexWrap: "wrap",
//           alignItems: "center",
//           justifyContent: "space-between",
//           rowGap: 10,
//           columnGap: 10,
//           marginBottom: 16,
//         }}
//       >
//         <Space>
//           <Button icon={<LeftOutlined />} onClick={handlePrevious} disabled={isFirst || total === 0}>
//             Previous
//           </Button>
//           <Button icon={<RightOutlined />} onClick={handleNext} disabled={isLast}>
//             Next
//           </Button>
//           <Text type="secondary">
//             {total > 0 ? `Record ${overallIndex + 1} of ${total}` : "No academic years yet"}
//           </Text>
//         </Space>
//         <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddNew}>
//           Add New
//         </Button>
//       </div>

//       <Card
//         variant="borderless"
//         style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
//       >
//         <Title level={5} style={{ marginTop: 0 }}>
//           Academic Year
//         </Title>
//         <Row gutter={16}>
//           <Col {...HALF_COL}>
//             <Form.Item
//               label="Academic Year Name"
//               name="academicYearName"
//               rules={[{ required: true, message: "Academic year name required" }]}
//             >
//               <Input placeholder="e.g. 2026-27" />
//             </Form.Item>
//           </Col>
//           <Col {...{ xs: 24, sm: 12, md: 8 }}>
//             <Form.Item
//               label="Start Date"
//               name="startDate"
//               rules={[{ required: true, message: "Start date required" }]}
//             >
//               <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
//             </Form.Item>
//           </Col>
//           <Col {...{ xs: 24, sm: 12, md: 8 }}>
//             <Form.Item
//               label="End Date"
//               name="endDate"
//               rules={[{ required: true, message: "End date required" }]}
//             >
//               <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
//             </Form.Item>
//           </Col>
//           <Col {...{ xs: 24, sm: 12, md: 8 }}>
//             <Form.Item
//               label="Is Current Academic Year?"
//               name="isCurrent"
//               rules={[{ required: true, message: "Please select Yes or No" }]}
//             >
//               <Radio.Group style={{ width: "100%" }}>
//                 <Radio.Button value={true} style={{ width: "50%", textAlign: "center" }}>
//                   Yes
//                 </Radio.Button>
//                 <Radio.Button value={false} style={{ width: "50%", textAlign: "center" }}>
//                   No
//                 </Radio.Button>
//               </Radio.Group>
//             </Form.Item>
//           </Col>
//         </Row>
//       </Card>

//       <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
//         <Title level={5} style={{ marginTop: 0 }}>
//           Stats Strip Values
//         </Title>
//         <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
//           These four values appear as the yellow highlight strip at the top of the Academics page.
//         </Text>
//         <Row gutter={[16, 8]}>
//           <Col {...QUARTER_COL}>
//             <Form.Item
//               label="CBSE Affiliated"
//               name="cbseAffiliated"
//               rules={[{ required: true, message: "CBSE affiliated value required" }]}
//             >
//               <Input placeholder="e.g. 100%" />
//             </Form.Item>
//           </Col>
//           <Col {...QUARTER_COL}>
//             <Form.Item
//               label="Avg. Passing Percentage"
//               name="avgPassingPercentage"
//               rules={[{ required: true, message: "Avg. passing percentage required" }]}
//             >
//               <Input placeholder="e.g. 98%" />
//             </Form.Item>
//           </Col>
//           <Col {...QUARTER_COL}>
//             <Form.Item
//               label="Subjects Offered"
//               name="subjectOffered"
//               rules={[{ required: true, message: "Subjects offered value required" }]}
//             >
//               <Input placeholder="e.g. 20+" />
//             </Form.Item>
//           </Col>
//           <Col {...QUARTER_COL}>
//             <Form.Item
//               label="Student-Teacher Ratio"
//               name="studentTeacherRatio"
//               rules={[{ required: true, message: "Student-teacher ratio required" }]}
//             >
//               <Input placeholder="e.g. 15:1" />
//             </Form.Item>
//           </Col>
//         </Row>
//       </Card>

//       <Card
//         variant="borderless"
//         style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginTop: 20 }}
//       >
//         <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
//           Achievements
//         </Title>
//         <Form.List name="subScreenDTOS">
//           {(scFields, { add: addSubScreen, remove: removeSubScreen }) => (
//             <>
//               {scFields.map((scField) => (
//                 <Card
//                   key={scField.key}
//                   type="inner"
//                   style={{ marginBottom: 16, borderRadius: 8 }}
//                   title={
//                     <Form.Item
//                       {...scField}
//                       name={[scField.name, "subScreenName"]}
//                       rules={[{ required: true, message: "Sub-screen name required" }]}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Input placeholder="e.g. Intra group" />
//                     </Form.Item>
//                   }
//                   extra={
//                     <MinusCircleOutlined
//                       onClick={() => {
//                         // Keep the id-tracking ref in sync with the form list
//                         // so subsequent indexes still line up correctly.
//                         subScreenIdsRef.current.splice(scField.name, 1);
//                         removeSubScreen(scField.name);
//                       }}
//                     />
//                   }
//                 >
//                   <Form.List name={[scField.name, "subScreenDataEntities"]}>
//                     {(dataFields, { add: addData, remove: removeData }) => (
//                       <>
//                         <Row gutter={[16, 16]}>
//                           {dataFields.map((dataField) => {
//                             const entryKey = `${scField.key}_${dataField.key}`;
//                             return (
//                               <Col {...HALF_COL} key={dataField.key}>
//                                 <div
//                                   style={{
//                                     padding: 16,
//                                     border: "1px solid #eee",
//                                     borderRadius: 8,
//                                     background: "#fafafa",
//                                     height: "100%",
//                                   }}
//                                 >
//                                   <Form.Item
//                                     key={`${dataField.key}-subjectData`}
//                                     name={[dataField.name, "subjectData"]}
//                                     hidden
//                                   >
//                                     <Input />
//                                   </Form.Item>

//                                   <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
//                                     <Form.Item
//                                       {...dataField}
//                                       name={[dataField.name, "subjectName"]}
//                                       rules={[{ required: true, message: "Subject name required" }]}
//                                       style={{ marginBottom: 8, flex: 1 }}
//                                     >
//                                       <Input placeholder="e.g. Sports event" />
//                                     </Form.Item>
//                                     <MinusCircleOutlined
//                                       onClick={() => {
//                                         // Keep the id-tracking ref in sync for this
//                                         // sub-screen's entities too.
//                                         subScreenIdsRef.current[scField.name]?.entities.splice(dataField.name, 1);
//                                         removeData(dataField.name);
//                                       }}
//                                       style={{ marginLeft: 8 }}
//                                     />
//                                   </Space>

//                                   <Upload
//                                     maxCount={1}
//                                     fileList={achievementFileLists[entryKey] ?? []}
//                                     beforeUpload={() => false}
//                                     onChange={(info) =>
//                                       handleAchievementFileChange(scField.name, dataField.name, entryKey, info)
//                                     }
//                                     onPreview={(file) => {
//                                       if (file.url) window.open(file.url, "_blank");
//                                     }}
//                                   >
//                                     <Button icon={<UploadOutlined />}>Add Data</Button>
//                                   </Upload>
//                                 </div>
//                               </Col>
//                             );
//                           })}
//                         </Row>
//                         <Button
//                           type="dashed"
//                           onClick={() => addData()}
//                           icon={<PlusOutlined />}
//                           style={{ marginTop: 16 }}
//                         >
//                           Add Data
//                         </Button>
//                       </>
//                     )}
//                   </Form.List>
//                 </Card>
//               ))}
//               <Button
//                 type="dashed"
//                 onClick={() => addSubScreen()}
//                 icon={<PlusOutlined />}
//                 style={{ width: "100%" }}
//               >
//                 Add Sub-Screen
//               </Button>
//             </>
//           )}
//         </Form.List>
//       </Card>

//       <Divider />
//       <Button type="primary" htmlType="submit" size="large" loading={saving}>
//         Save Changes
//       </Button>
//     </Form>
//   );
// }

/* ------------------------------------------------------------------ */
/* Pre-Primary / Primary / Secondary — backed by ClassRoomDTO.        */
/* Each ClassRoomDTO now embeds its own academicYearDTOS[] (full       */
/* Top-Stats-Strip fields + nested Achievements), shown as a repeatable */
/* "Academic Years" section above "Subjects Offered". Same id-tracking */
/* ref pattern as the Top Stats Strip tab, one level deeper.           */
/* ------------------------------------------------------------------ */

function ClassRoomSection({ classRoomName, title }: { classRoomName: string; title: string }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classRoomId, setClassRoomId] = useState<number | undefined>();
  const [brochureBase64, setBrochureBase64] = useState<string | null>(null);
  const [brochureFileList, setBrochureFileList] = useState<UploadFile[]>([]);

  // Tracks the Upload fileList shown for each nested Achievements "Add Data"
  // entry, keyed by `${academicYearFieldKey}_${subScreenFieldKey}_${dataEntityFieldKey}`.
  const [achievementFileLists, setAchievementFileLists] = useState<Record<string, UploadFile[]>>({});

  // Guards against StrictMode's double-invoke AND stray re-renders firing
  // a second fetch for the same classRoomName.
  const fetchedForRef = useRef<string | null>(null);

  // Holds the real DB ids for existing academicYearDTOS entries (and their
  // nested subScreenDTOS / subScreenDataEntities), indexed by array
  // position. Same reasoning as the Top Stats Strip tab: antd's nested
  // Form.List + hidden fields proved unreliable for carrying ids through to
  // submit, so we track them here and re-attach them by index instead.
  const academicYearIdsRef = useRef<
    {
      academicYearId?: number;
      classRoomId?: number;
      subScreens: {
        subScreenId?: number;
        academicYearId?: number;
        entities: { subScreenDataId?: number; subScreenId?: number }[];
      }[];
    }[]
  >([]);

  useEffect(() => {
    if (fetchedForRef.current === classRoomName) return;
    fetchedForRef.current = classRoomName;

    setLoading(true);

    // Ask for more than 1 record: many backends do a partial/LIKE match on
    // classRoomName (e.g. searching "Primary" also matches "Pre-Primary"),
    // so relying on Data[0] with pageSize=1 can silently return the wrong
    // section. We fetch a small page and pick the EXACT name match below.
    getAllClassRooms(0, 10, { classRoomName })
      .then((res) => {
        console.log(`[${classRoomName}] Response:`, res.data);

        const list = res.data?.data?.Data ?? [];

        // Exact, case-insensitive match only — do NOT fall back to list[0],
        // that's what was letting "Primary" resolve to "Pre-Primary".
        const existing = list.find(
          (c: any) =>
            (c.classRoomName ?? "").trim().toLowerCase() ===
            classRoomName.trim().toLowerCase()
        );

        if (existing) {
          setClassRoomId(existing.classRoomId);
          setBrochureBase64(existing.brochure ?? null);

          setBrochureFileList(
            existing.brochure ? [buildUploadFileFromBase64(existing.brochure, "-1", "brochure")] : []
          );

          form.setFieldsValue({
            classRoomName: existing.classRoomName,
            academicYearName: existing.academicYearName,
            description: existing.description,
            medium: existing.medium,
            subjectDTOList: existing.subjectDTOList ?? [],
            academicYearDTOS: (existing.academicYearDTOS ?? []).map((ay: any) => ({
              ...ay,
              startDate: ay.startDate ? dayjs(ay.startDate) : undefined,
              endDate: ay.endDate ? dayjs(ay.endDate) : undefined,
            })),
          });

          // Keep the real ids out of the form entirely — track them by
          // position here so they can't get lost to any Form.List quirk.
          academicYearIdsRef.current = (existing.academicYearDTOS ?? []).map((ay: any) => ({
            academicYearId: ay.academicYearId,
            classRoomId: ay.classRoomId,
            subScreens: (ay.subScreenDTOS ?? []).map((sc: any) => ({
              subScreenId: sc.subScreenId,
              academicYearId: sc.academicYearId,
              entities: (sc.subScreenDataEntities ?? []).map((d: any) => ({
                subScreenDataId: d.subScreenDataId,
                subScreenId: d.subScreenId,
              })),
            })),
          }));

          const initialFileLists: Record<string, UploadFile[]> = {};
          (existing.academicYearDTOS ?? []).forEach((ay: any, ayIdx: number) => {
            (ay.subScreenDTOS ?? []).forEach((sc: any, scIdx: number) => {
              (sc.subScreenDataEntities ?? []).forEach((entity: any, dIdx: number) => {
                if (entity.subjectData) {
                  initialFileLists[`${ayIdx}_${scIdx}_${dIdx}`] = [
                    buildUploadFileFromBase64(
                      entity.subjectData,
                      `${ayIdx}-${scIdx}-${dIdx}`,
                      entity.subjectName ? `${entity.subjectName} - file` : "file"
                    ),
                  ];
                }
              });
            });
          });
          setAchievementFileLists(initialFileLists);

          console.log("Form Values:", form.getFieldsValue(true));
        } else {
          setClassRoomId(undefined);
          setBrochureBase64(null);
          setBrochureFileList([]);
          academicYearIdsRef.current = [];
          setAchievementFileLists({});
          form.resetFields();
          form.setFieldsValue({
            classRoomName,
            subjectDTOList: [],
            academicYearDTOS: [],
          });
        }
      })
      .catch(() => {
        message.error(`Failed to load ${title} data`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [classRoomName, form, title]);

  const handleBrochureChange = async (info: { fileList: UploadFile[] }) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setBrochureFileList([]);
      setBrochureBase64(null);
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      setBrochureBase64(base64);
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setBrochureFileList([file]);
  };

  const handleAchievementFileChange = async (
    ayFieldName: number,
    scFieldName: number,
    dataFieldName: number,
    entryKey: string,
    info: { fileList: UploadFile[] }
  ) => {
    const file = info.fileList[info.fileList.length - 1];

    if (!file) {
      setAchievementFileLists((prev) => ({ ...prev, [entryKey]: [] }));
      form.setFieldValue(
        [
          "academicYearDTOS",
          ayFieldName,
          "subScreenDTOS",
          scFieldName,
          "subScreenDataEntities",
          dataFieldName,
          "subjectData",
        ],
        null
      );
      return;
    }

    if (file.originFileObj) {
      const base64 = await fileToBase64(file.originFileObj as File);
      form.setFieldValue(
        [
          "academicYearDTOS",
          ayFieldName,
          "subScreenDTOS",
          scFieldName,
          "subScreenDataEntities",
          dataFieldName,
          "subjectData",
        ],
        base64
      );
      file.url = URL.createObjectURL(file.originFileObj as File);
    }

    setAchievementFileLists((prev) => ({ ...prev, [entryKey]: [file] }));
  };

  const handleFinish = async (values: any) => {
    setSaving(true);

    const academicYearDTOS = (values.academicYearDTOS || []).map((ay: any, ayIdx: number) => {
      const origAy = academicYearIdsRef.current[ayIdx];
      return {
        ...(origAy?.academicYearId ? { academicYearId: origAy.academicYearId } : {}),
        ...(origAy?.classRoomId ? { classRoomId: origAy.classRoomId } : {}),
        academicYearName: ay.academicYearName,
        startDate: dayjs(ay.startDate).format("YYYY-MM-DD"),
        endDate: dayjs(ay.endDate).format("YYYY-MM-DD"),
        isCurrent: ay.isCurrent,
        cbseAffiliated: ay.cbseAffiliated,
        avgPassingPercentage: ay.avgPassingPercentage,
        subjectOffered: ay.subjectOffered,
        studentTeacherRatio: ay.studentTeacherRatio,
        subScreenDTOS: (ay.subScreenDTOS || []).map((sc: any, scIdx: number) => {
          const origSc = origAy?.subScreens?.[scIdx];
          return {
            ...(origSc?.subScreenId ? { subScreenId: origSc.subScreenId } : {}),
            ...(origSc?.academicYearId ? { academicYearId: origSc.academicYearId } : {}),
            subScreenName: sc.subScreenName,
            subScreenDataEntities: (sc.subScreenDataEntities || []).map((d: any, dIdx: number) => {
              const origEntity = origSc?.entities?.[dIdx];
              return {
                ...(origEntity?.subScreenDataId ? { subScreenDataId: origEntity.subScreenDataId } : {}),
                ...(origEntity?.subScreenId ? { subScreenId: origEntity.subScreenId } : {}),
                subjectName: d.subjectName,
                subjectData: d.subjectData ?? null,
              };
            }),
          };
        }),
      };
    });

    const payload = {
      classRoomName: values.classRoomName,
      academicYearName: values.academicYearName,
      description: values.description ?? "",
      medium: values.medium,
      subjectDTOList: (values.subjectDTOList || []).map((s: any) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectDescription: s.subjectDescription ?? "",
      })),
      brochure: brochureBase64,
      academicYearDTOS,
    };
    try {
      if (classRoomId) {
        const res = await updateClassRoom({ ...payload, classRoomId });
        setClassRoomId(res.data.data.classRoomId);
      } else {
        const res = await saveClassRoom(payload);
        setClassRoomId(res.data.data.classRoomId);
      }
      message.success(`${title} details saved`);
    } catch {
      message.error(`Failed to save ${title} details`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Spin tip={`Loading ${title} data...`} />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Row gutter={16}>
          <Col {...HALF_COL}>
            <Form.Item label="Section Name" name="classRoomName" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col {...HALF_COL}>
            <Form.Item
              label="Academic Year Name"
              name="academicYearName"
              rules={[{ required: true, message: "Academic year name required" }]}
            >
              <Input placeholder="e.g. 2026-27" />
            </Form.Item>
          </Col>
          <Col {...HALF_COL}>
            <Form.Item
              label="Medium"
              name="medium"
              rules={[{ required: true, message: "Please select a medium" }]}
            >
              <Select
                placeholder="Select medium"
                options={[
                  { value: "English", label: "English" },
                  { value: "Marathi", label: "Marathi" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Description" name="description">
              <TextArea rows={2} placeholder="Short description shown for this section" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          Academic Years
        </Title>
        <Form.List name="academicYearDTOS">
          {(ayFields, { add: addAcademicYear, remove: removeAcademicYear }) => (
            <>
              {ayFields.map((ayField) => (
                <Card
                  key={ayField.key}
                  type="inner"
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  title={
                    <Form.Item
                      {...ayField}
                      name={[ayField.name, "academicYearName"]}
                      rules={[{ required: true, message: "Academic year name required" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="e.g. 2025-2026" />
                    </Form.Item>
                  }
                  extra={
                    <MinusCircleOutlined
                      onClick={() => {
                        // Keep the id-tracking ref in sync with the form list
                        // so subsequent indexes still line up correctly.
                        academicYearIdsRef.current.splice(ayField.name, 1);
                        removeAcademicYear(ayField.name);
                      }}
                    />
                  }
                >
                  <Row gutter={16}>
                    <Col {...{ xs: 24, sm: 12, md: 8 }}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "startDate"]}
                        label="Start Date"
                        rules={[{ required: true, message: "Start date required" }]}
                      >
                        <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col {...{ xs: 24, sm: 12, md: 8 }}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "endDate"]}
                        label="End Date"
                        rules={[{ required: true, message: "End date required" }]}
                      >
                        <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col {...{ xs: 24, sm: 12, md: 8 }}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "isCurrent"]}
                        label="Is Current Academic Year?"
                        rules={[{ required: true, message: "Please select Yes or No" }]}
                      >
                        <Radio.Group style={{ width: "100%" }}>
                          <Radio.Button value={true} style={{ width: "50%", textAlign: "center" }}>
                            Yes
                          </Radio.Button>
                          <Radio.Button value={false} style={{ width: "50%", textAlign: "center" }}>
                            No
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    <Col {...QUARTER_COL}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "cbseAffiliated"]}
                        label="CBSE Affiliated"
                        rules={[{ required: true, message: "CBSE affiliated value required" }]}
                      >
                        <Input placeholder="e.g. Yes" />
                      </Form.Item>
                    </Col>
                    <Col {...QUARTER_COL}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "avgPassingPercentage"]}
                        label="Avg. Passing Percentage"
                        rules={[{ required: true, message: "Avg. passing percentage required" }]}
                      >
                        <Input placeholder="e.g. 95%" />
                      </Form.Item>
                    </Col>
                    <Col {...QUARTER_COL}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "subjectOffered"]}
                        label="Subjects Offered"
                        rules={[{ required: true, message: "Subjects offered value required" }]}
                      >
                        <Input placeholder="e.g. Science, Commerce" />
                      </Form.Item>
                    </Col>
                    <Col {...QUARTER_COL}>
                      <Form.Item
                        {...ayField}
                        name={[ayField.name, "studentTeacherRatio"]}
                        label="Student-Teacher Ratio"
                        rules={[{ required: true, message: "Student-teacher ratio required" }]}
                      >
                        <Input placeholder="e.g. 30:1" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "12px 0" }} />
                  <Text strong style={{ display: "block", marginBottom: 12 }}>
                    Achievements
                  </Text>
                  <Form.List name={[ayField.name, "subScreenDTOS"]}>
                    {(scFields, { add: addSubScreen, remove: removeSubScreen }) => (
                      <>
                        {scFields.map((scField) => (
                          <Card
                            key={scField.key}
                            size="small"
                            style={{ marginBottom: 12, borderRadius: 8, background: "#fcfcfc" }}
                            title={
                              <Form.Item
                                {...scField}
                                name={[scField.name, "subScreenName"]}
                                rules={[{ required: true, message: "Sub-screen name required" }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="e.g. Documents" />
                              </Form.Item>
                            }
                            extra={
                              <MinusCircleOutlined
                                onClick={() => {
                                  academicYearIdsRef.current[ayField.name]?.subScreens.splice(scField.name, 1);
                                  removeSubScreen(scField.name);
                                }}
                              />
                            }
                          >
                            <Form.List name={[scField.name, "subScreenDataEntities"]}>
                              {(dataFields, { add: addData, remove: removeData }) => (
                                <>
                                  <Row gutter={[16, 16]}>
                                    {dataFields.map((dataField) => {
                                      const entryKey = `${ayField.key}_${scField.key}_${dataField.key}`;
                                      return (
                                        <Col {...HALF_COL} key={dataField.key}>
                                          <div
                                            style={{
                                              padding: 16,
                                              border: "1px solid #eee",
                                              borderRadius: 8,
                                              background: "#fafafa",
                                              height: "100%",
                                            }}
                                          >
                                            <Form.Item
                                              key={`${dataField.key}-subjectData`}
                                              name={[dataField.name, "subjectData"]}
                                              hidden
                                            >
                                              <Input />
                                            </Form.Item>

                                            <Space
                                              align="baseline"
                                              style={{ width: "100%", justifyContent: "space-between" }}
                                            >
                                              <Form.Item
                                                {...dataField}
                                                name={[dataField.name, "subjectName"]}
                                                rules={[{ required: true, message: "Subject name required" }]}
                                                style={{ marginBottom: 8, flex: 1 }}
                                              >
                                                <Input placeholder="e.g. Syllabus" />
                                              </Form.Item>
                                              <MinusCircleOutlined
                                                onClick={() => {
                                                  academicYearIdsRef.current[ayField.name]?.subScreens?.[
                                                    scField.name
                                                  ]?.entities.splice(dataField.name, 1);
                                                  removeData(dataField.name);
                                                }}
                                                style={{ marginLeft: 8 }}
                                              />
                                            </Space>

                                            <Upload
                                              maxCount={1}
                                              fileList={achievementFileLists[entryKey] ?? []}
                                              beforeUpload={() => false}
                                              onChange={(info) =>
                                                handleAchievementFileChange(
                                                  ayField.name,
                                                  scField.name,
                                                  dataField.name,
                                                  entryKey,
                                                  info
                                                )
                                              }
                                              onPreview={(file) => {
                                                if (file.url) window.open(file.url, "_blank");
                                              }}
                                            >
                                              <Button icon={<UploadOutlined />}>Add Data</Button>
                                            </Upload>
                                          </div>
                                        </Col>
                                      );
                                    })}
                                  </Row>
                                  <Button
                                    type="dashed"
                                    onClick={() => addData()}
                                    icon={<PlusOutlined />}
                                    style={{ marginTop: 16 }}
                                  >
                                    Add Data
                                  </Button>
                                </>
                              )}
                            </Form.List>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => addSubScreen()}
                          icon={<PlusOutlined />}
                          style={{ width: "100%" }}
                        >
                          Add Sub-Screen
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={() => addAcademicYear()}
                icon={<PlusOutlined />}
                style={{ width: "100%" }}
              >
                Add Academic Year
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          Subjects Offered
        </Title>
        <Form.List name="subjectDTOList">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                {fields.map((field) => (
                  <Col {...HALF_COL} key={field.key}>
                    <div
                      style={{
                        padding: 16,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        background: "#fafafa",
                        height: "100%",
                      }}
                    >
                      <Form.Item {...field} name={[field.name, "subjectId"]} hidden>
                        <Input />
                      </Form.Item>
                      <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
                        <Form.Item
                          {...field}
                          name={[field.name, "subjectName"]}
                          rules={[{ required: true, message: "Subject name required" }]}
                          style={{ marginBottom: 8, flex: 1 }}
                        >
                          <Input placeholder="Subject name e.g. Early Mathematics" />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(field.name)} style={{ marginLeft: 8 }} />
                      </Space>
                      <Form.Item
                        {...field}
                        name={[field.name, "subjectDescription"]}
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={2} placeholder="Short description shown under the subject" />
                      </Form.Item>
                    </div>
                  </Col>
                ))}
              </Row>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ marginTop: 16 }}>
                Add Subject
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Card
        variant="borderless"
        style={{ borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginTop: 20 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
          Upload Brochure
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          PDF brochure shown for this school section. Leave untouched to keep the existing file.
        </Text>
        <Upload
          accept=".pdf"
          maxCount={1}
          fileList={brochureFileList}
          beforeUpload={() => false}
          onChange={handleBrochureChange}
          onPreview={(file) => {
            if (file.url) {
              window.open(file.url, "_blank");
            }
          }}
        >
          <Button icon={<UploadOutlined />}>Select PDF Brochure</Button>
        </Upload>
      </Card>

      <Divider />
      <Button type="primary" htmlType="submit" size="large" loading={saving}>
        Save {title}
      </Button>
    </Form>
  );
}