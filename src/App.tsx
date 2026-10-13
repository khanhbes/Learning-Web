import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { api } from "./api";
import { AppContext, useApp } from "./context";
import type { AppState, Course } from "./types";
import { Byte, Icon, Button, Modal, ProgressBar } from "./components";
import {
  Home,
  League,
  Quests,
  Shop,
  Profile,
  Review,
  Sources,
  PracticeHub,
} from "./pages";
import LessonPage from "./LessonPage";
import CapstonePage from "./CapstonePage";
import SignIn from "./SignIn";
import { CoursesPage, LearningHub, LevelCelebration } from "./Expansion";
import KnowledgePage from "./KnowledgePage";
import "./expansion.css";
const nav = [
  ["/", "map", "Học"],
  ["/learn", "target", "Luyện"],
  ["/league", "trophy", "Xếp hạng"],
  ["/shop", "shop", "Cửa hàng"],
  ["/profile", "user", "Hồ sơ"],
];
function CourseBoundary({capstone=false,legacy=false}:{capstone?:boolean;legacy?:boolean}) {
  const {course,courses,selectCourse,notify}=useApp(),params=useParams();
  const target=legacy?"dsa":params.courseId;
  useEffect(()=>{if(target && courses.some(c=>c.id===target) && course.id!==target)void selectCourse(target).catch(e=>notify(e.message));},[target,course.id]);
  if(!target || !courses.some(c=>c.id===target))return <p>Không tìm thấy khóa học.</p>;
  if(course.id!==target)return <p role="status">Đang mở khóa học…</p>;
  return capstone?<CapstonePage key={target}/>:<LessonPage key={target+params.id}/>;
}
function Sidebar() {
  const { state } = useApp();
  return (
    <aside className="sidebar">
      <Link to="/" className="brand" aria-label="BytePath trang chủ">
        <span className="brand-symbol">
          <Icon name="code" size={30} />
        </span>
        byte<span>path</span>
        <span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Điều hướng chính">
        {nav.map(([to, icon, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon name={icon} size={26} />
            <span>{label}</span>
            {to === "/review" && state.reviewDue > 0 ? (
              <b className="nav-badge">{state.reviewDue}</b>
            ) : null}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Link to="/courses"><Icon name="layers" size={17} /> Các khóa học</Link>
        <div className="little-code">&lt; / &gt;</div>
        <p>
          Mỗi bước nhỏ.
          <br />
          <strong>Một ý tưởng lớn.</strong>
        </p>
        <Link to="/sources">
          <Icon name="bookmark" size={17} /> Tài liệu nguồn
        </Link>
        <span className="local-label">
          <i /> Học trên máy của bạn
        </span>
      </div>
    </aside>
  );
}
function Topbar() {
  const { state, course, courses, selectCourse, refresh, notify } = useApp();
  return (
    <header className="topbar">
      <Link to="/" className="mobile-brand">
        bytepath.
      </Link>
      <label className="course-switch" aria-label="Khóa đang học">
        <Icon name={course.id === "ml" ? "brain" : "code"} size={21} />
        <select value={course.id} onChange={e => void selectCourse(e.target.value).catch(e => notify(e.message))}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.id.toUpperCase()} · {c.title}</option>)}
        </select>
      </label>
      <div className="topbar-stats">
        <button
          className="language-chip"
          title="Đổi ngôn ngữ lập trình"
          disabled={course.id === "ml"}
          onClick={async () => {
            try {
              await api("/profile", "PUT", {
                ...state.profile,
                language:
                  state.profile.language === "python" ? "cpp" : "python",
              });
              await refresh();
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        >
          <span className={`language-flag ${state.profile.language}`}>
            {state.profile.language === "python" ? "Py" : "C+"}
          </span>
          <span>{state.profile.language === "python" ? "Python" : "C++"}</span>
          <Icon name="next" size={14} />
        </button>
        <Link to="/quests" className="stat gift" title="Nhiệm vụ hôm nay"><Icon name="gift" /></Link>
        <Link to="/profile" className="stat flame" title="Chuỗi ngày học">
          <Icon name="flame" />
          {state.streak}
        </Link>
        <Link to="/shop" className="stat gem" title="Gem của bạn">
          <Icon name="gem" />
          {state.gems}
        </Link>
        <Link
          to="/shop"
          className="stat energy"
          title="Năng lượng · kiểm tra luôn miễn phí"
        >
          <Icon name="zap" />
          {state.energy}
          <small>/30</small>
        </Link>
      </div>
    </header>
  );
}
function Welcome() {
  const { state, refresh, notify } = useApp();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [goal, setGoal] = useState(50);
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={!state.profile.name} title="Chào mừng tới BytePath">
      <div className="welcome">
        <span className="eyebrow">MỘT HÀNH TRÌNH MỚI</span>
        <Byte size={150} mood="wave" />
        <h1>Chào bạn, mình là Byte!</h1>
        <p>
          Cùng biến những thuật toán khó hiểu thành những bước thật đơn giản
          nhé.
        </p>
        <label>
          Tên bạn là gì?
          <input
            autoFocus
            maxLength={32}
            placeholder="Tên của bạn"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="welcome-languages">
          {(["python", "cpp"] as const).map((l) => (
            <button
              key={l}
              className={`choice ${language === l ? "chosen" : ""}`}
              onClick={() => setLanguage(l)}
            >
              <span className={`language-flag ${l}`}>
                {l === "python" ? "Py" : "C+"}
              </span>
              <strong>{l === "python" ? "Python" : "C++"}</strong>
              <small>
                {l === "python" ? "Dễ bắt đầu" : "Theo tài liệu gốc"}
              </small>
              {language === l && <Icon name="check" size={20} />}
            </button>
          ))}
        </div>
        <label>
          Mục tiêu mỗi ngày
          <select
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          >
            <option value={20}>Nhẹ nhàng · 20 XP</option>
            <option value={50}>Đều đặn · 50 XP</option>
            <option value={100}>Tập trung · 100 XP</option>
          </select>
        </label>
        <Button
          busy={busy}
          disabled={!name.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await api("/profile", "PUT", {
                name: name.trim(),
                language,
                dailyGoal: goal,
              });
              await refresh();
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          BẮT ĐẦU KHÁM PHÁ <Icon name="right" size={20} />
        </Button>
        <small>
          Học theo tốc độ của bạn. Có thể đổi ngôn ngữ bất kỳ lúc nào.
        </small>
      </div>
    </Modal>
  );
}
function RightRail() {
  const { state } = useApp(),
    today = state.daily[state.today]?.xp || 0;
  return (
    <aside className="right-rail">
      <div className="rail-illustration">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <span className="floating-code">&lt;/&gt;</span>
        <Byte size={145} skin={state.profile.skin} />
        <span className="floating-star">
          <Icon name="star" size={22} />
        </span>
        <h3>
          Một chút mỗi ngày,
          <br />
          tiến xa hơn bạn nghĩ.
        </h3>
      </div>
      <section className="rail-section">
        <div className="row between">
          <h3>Mục tiêu hôm nay</h3>
          <Icon name="target" className="orange-text" size={24} />
        </div>
        <div className="row between goal-numbers">
          <span>
            {Math.min(today, state.profile.dailyGoal)}{" "}
            <small>/ {state.profile.dailyGoal} XP</small>
          </span>
          <span>
            {Math.round(Math.min(1, today / state.profile.dailyGoal) * 100)}%
          </span>
        </div>
        <ProgressBar
          value={today}
          max={state.profile.dailyGoal}
          color="orange"
        />
        <p>
          {today >= state.profile.dailyGoal
            ? "Đã đạt mục tiêu. Byte tự hào về bạn!"
            : "Bạn chỉ cần một bước nhỏ để bắt đầu."}
        </p>
      </section>
      <section className="rail-section">
        <div className="row between">
          <h3>Nhiệm vụ hằng ngày</h3>
          <Link className="text-link" to="/quests">
            XEM TẤT CẢ
          </Link>
        </div>
        {state.quests.slice(0, 2).map((q) => (
          <div className="rail-quest" key={q.id}>
            <span className={`quest-symbol ${q.id}`}>
              <Icon name={q.icon} size={24} />
            </span>
            <div>
              <strong>{q.title}</strong>
              <ProgressBar value={q.current} max={q.target} />
            </div>
          </div>
        ))}
      </section>
      <Link to="/league" className="league-teaser">
        <span className="league-shield">
          <Icon name="shield" size={32} />
        </span>
        <div>
          <strong>Giải đấu {state.tierName}</strong>
          <span>
            Bạn đang ở hạng #{state.leagueRows.find((r) => !r.isBot)?.rank}
          </span>
          <small>19 đối thủ mô phỏng</small>
        </div>
        <Icon name="next" size={19} />
      </Link>
      <div className="rail-footer">
        <Link to="/sources">TÀI LIỆU</Link>
        <Link to="/profile">CÀI ĐẶT</Link>
        <span>BYTEPATH © 2026</span>
      </div>
    </aside>
  );
}
export default function App() {
  const [state, setState] = useState<AppState | null>(null),
    [course, setCourse] = useState<Course | null>(null),
    [courses, setCourses] = useState<Course[]>([]),
    [health, setHealth] = useState<any>(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const location = useLocation();
  async function refresh() {
    const [s, catalog] = await Promise.all([api<AppState>("/state"), api<{courses: Course[]}>("/courses")]);
    const selected = s.activeCourse || s.profile.activeCourse || "dsa";
    const c = await api<Course>("/courses/" + selected);
    setState(s); setCourse(c); setCourses(catalog.courses);
    setNeedsLogin(false);
    setError("");
  }
  async function selectCourse(courseId: string) {
    await api("/profile", "PUT", { ...state?.profile, activeCourse: courseId,language:state?.courses?.[courseId]?.language || "python" });
    await refresh();
  }
  useEffect(() => {
    refresh().catch((e) => {
      setError(e.message);
      if (e.status === 401) setNeedsLogin(true);
    });
    api("/health")
      .then(setHealth)
      .catch(() => {});
    const sync = () => {
      refresh().catch((e) => {
        if (e.status === 401) setNeedsLogin(true);
      });
      api("/health")
        .then(setHealth)
        .catch(() => {});
    };
    const timer = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", !!state?.profile.settings?.reducedMotion);
  }, [state?.profile.settings?.reducedMotion]);
  if (needsLogin) return <SignIn onSuccess={refresh} />;
  if (!state || !course)
    return (
      <div className="boot">
        <Byte size={140} mood="thinking" />
        <h2>
          {error ? "Byte chưa kết nối được" : "Chuẩn bị hành trình của bạn…"}
        </h2>
        <p>{error || "Đang mở các khóa học"}</p>
        {error && (
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        )}
      </div>
    );
  const immersive = /\/(?:lesson)\//.test(location.pathname);
  return (
    <AppContext.Provider
      value={{ state, course, courses, selectCourse, refresh, notify: setToast, health }}
    >
      <MotionConfig reducedMotion={state.profile.settings?.reducedMotion ? "always" : "user"}>
      {!immersive && <Sidebar />}
      <div className={immersive ? "immersive" : "app-content"}>
        {!immersive && <Topbar />}
        <div
          className={
            !immersive && location.pathname === "/"
              ? "home-layout"
              : "page-layout"
          }
        >
          <main>
            <Routes>
              <Route path="/" element={<Home key={course.id} />} />
              <Route path="/lesson/:id" element={<CourseBoundary legacy />} />
              <Route path="/courses/:courseId/lesson/:id" element={<CourseBoundary />} />
              <Route path="/courses/:courseId/capstone" element={<CourseBoundary capstone />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/learn" element={<LearningHub />} />
              <Route path="/knowledge" element={<KnowledgePage key={course.id} />} />
              <Route path="/review" element={<Review />} />
              <Route path="/practice" element={<PracticeHub />} />
              <Route path="/league" element={<League />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/capstone" element={<CourseBoundary capstone legacy />} />
              <Route path="*" element={<Home key={course.id} />} />
            </Routes>
          </main>
          {!immersive && location.pathname === "/" && <RightRail />}
        </div>
      </div>
      {!immersive && (
        <nav className="mobile-nav" aria-label="Điều hướng điện thoại">
          {nav.slice(0, 5).map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon name={icon} size={23} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      <Welcome />
      <LevelCelebration />
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <Icon name="info" size={22} />
            <span>{toast}</span>
            <button
              className="icon-button"
              onClick={() => setToast("")}
              aria-label="Đóng thông báo"
            >
              <Icon name="close" size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </MotionConfig>
    </AppContext.Provider>
  );
}
