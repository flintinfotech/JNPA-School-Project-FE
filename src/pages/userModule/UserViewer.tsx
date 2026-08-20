import { Form, Input } from "antd";
import type { UserDTO } from "../../services/userService";

interface UserViewerProps {
  user: UserDTO | null;
}

export default function UserViewer({ user }: UserViewerProps) {
  if (!user) return null;

  const roleLabel = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "";

  const screensLabel =
    user.screens && user.screens.length > 0
      ? user.screens.map((s) => s.screenName).join(", ")
      : "-";

  return (
    <Form layout="vertical">
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="Username">
            <Input value={user.userName} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="First Name">
            <Input value={user.firstName} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="Last Name">
            <Input value={user.lastName} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="Email">
            <Input value={user.email} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="Mobile No">
            <Input value={user.mobileNo} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        <div style={{ flex: "1 1 45%" }}>
          <Form.Item label="Role">
            <Input value={roleLabel} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
        {user.section && (
          <div style={{ flex: "1 1 45%" }}>
            <Form.Item label="Section">
              <Input value={user.section} disabled styles={{ input: { color: "#000" } }} />
            </Form.Item>
          </div>
        )}
        {user.medium && (
          <div style={{ flex: "1 1 45%" }}>
            <Form.Item label="Medium">
              <Input value={user.medium} disabled styles={{ input: { color: "#000" } }} />
            </Form.Item>
          </div>
        )}
        <div style={{ flex: "1 1 100%" }}>
          <Form.Item label="Screens">
            <Input value={screensLabel} disabled styles={{ input: { color: "#000" } }} />
          </Form.Item>
        </div>
      </div>
    </Form>
  );
}