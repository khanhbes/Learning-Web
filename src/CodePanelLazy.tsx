import { lazy, Suspense, type ComponentProps } from "react";
import { Icon } from "./components";
const CodePanel = lazy(() => import("./CodePanel"));
export default function CodePanelLazy(
  props: ComponentProps<typeof import("./CodePanel").default>,
) {
  return (
    <Suspense
      fallback={
        <div className="editor-loading">
          <Icon name="loading" className="spin" /> Chuẩn bị phòng code…
        </div>
      }
    >
      <CodePanel {...props} />
    </Suspense>
  );
}
