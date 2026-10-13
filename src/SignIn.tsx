import { useState } from "react";
import { api } from "./api";
import { Byte, Button, Icon } from "./components";
export default function SignIn({
  onSuccess,
}: {
  onSuccess: () => Promise<void>;
}) {
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="boot">
      <div className="sign-in">
        <Byte size={140} />
        <span className="eyebrow">BYTEPATH</span>
        <h1>Hành trình của riêng bạn</h1>
        <p>Đăng nhập để tiếp tục học và giữ tiến độ.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/auth/login", "POST", { password });
              setPassword("");
              await onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Mật khẩu
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <Button busy={busy} type="submit">
            MỞ HÀNH TRÌNH <Icon name="right" size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
