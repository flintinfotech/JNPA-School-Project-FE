import { Tabs, Form, Input } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function EmployeeViewer({ user }: any) {
  const [activeTab, setActiveTab] = useState("1");

  if (!user) return null;

  const documents = user.userDocumentDTOS || [];

  const cleanBase64 = (base64: string) => {
    return base64.replace(/^data:.*;base64,/, "").replace(/[\r\n\s]/g, "");
  };

  // Detect the real file type from the actual decoded bytes, never trust documentType
  const detectMimeFromBase64 = (rawBase64: string): string => {
    const signature = rawBase64.substring(0, 12);

    if (signature.startsWith("JVBERi0")) return "application/pdf";        // %PDF-
    if (signature.startsWith("iVBORw0KGgo")) return "image/png";          // PNG
    if (signature.startsWith("/9j/")) return "image/jpeg";                // JPEG
    if (signature.startsWith("R0lGOD")) return "image/gif";               // GIF
    if (signature.startsWith("UEsDB")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // .docx
    if (signature.startsWith("0M8R4K")) return "application/msword";      // legacy .doc

    return "application/octet-stream";
  };

  const extensionForMime = (mime: string) => {
    if (mime === "application/pdf") return "pdf";
    if (mime === "image/png") return "png";
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/gif") return "gif";
    if (mime.includes("wordprocessingml")) return "docx";
    if (mime === "application/msword") return "doc";
    return "file";
  };

  const openDocument = (doc: any) => {
    if (!doc.document) {
      console.warn("No document data for", doc.documentName);
      return;
    }

    try {
      const cleaned = cleanBase64(doc.document);
      const mime = detectMimeFromBase64(cleaned);

      const byteCharacters = atob(cleaned);
      const byteArrays: Uint8Array[] = [];
      const sliceSize = 1024;

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }

      const blob = new Blob(byteArrays, { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("Failed to decode/open document:", err);
    }
  };

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        {
          key: "1",
          label: "Employee Details",
          children: (
            <Form layout="vertical">
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 45%", }}>
                  <Form.Item label="Employee Code">
                    <Input value={user.employeeCode} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="User ID">
                    <Input value={user.userId} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="First Name">
                    <Input value={user.firstName} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>

                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Middle Name">
                    <Input value={user.middleName} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Last Name">
                    <Input value={user.lastName} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Gender">
                    <Input value={user.gender} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Qualification">
                    <Input value={user.qualification} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Specialization">
                    <Input value={user.specialization} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Experience">
                    <Input value={user.experience} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Designation">
                    <Input value={user.designation} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 45%" }}>
                  <Form.Item label="Blood Group">
                    <Input value={user.bloodGroup} disabled styles={{ input: { color: "#000", }, }} />
                  </Form.Item>
                </div>
                <div style={{ flex: "1 1 100%" }}>
                  <Form.Item label="Address">
                    <Input.TextArea
                      rows={3}
                      value={user.address}
                      disabled
                      style={{
                        color: "#000",
                        WebkitTextFillColor: "#000",
                      }}
                    />
                  </Form.Item>
                </div>
              </div>
            </Form>
          ),
        },
        {
          key: "2",
          label: "Documents",
          children: (
            <div>
              {documents.length > 0 ? (
                documents.map((doc: any, index: number) => {
                  const cleaned = doc.document ? cleanBase64(doc.document) : "";
                  const mime = cleaned ? detectMimeFromBase64(cleaned) : "application/octet-stream";
                  const ext = extensionForMime(mime);

                  return (
                    <div
                      key={doc.userDocumentId ?? index}
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: 8,
                        padding: 24,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: "flex", gap: 40, marginBottom: 24 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 8, fontWeight: 500 }}>Document Name</div>
                          <Input value={doc.documentName || ""} disabled styles={{ input: { color: "#000", }, }} />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 8, fontWeight: 500 }}>Upload Date</div>
                          <Input value={doc.uploadDate || ""} disabled styles={{ input: { color: "#000", }, }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 8, fontWeight: 500 }}>File</div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#1677ff",
                          cursor: "pointer",
                        }}
                        onClick={() => openDocument(doc)}
                      >
                        <PaperClipOutlined />
                        <span>{doc.documentName || "document"}.{ext}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", color: "#999", padding: 40 }}>
                  No Documents Available
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}