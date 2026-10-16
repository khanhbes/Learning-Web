import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useMotionPreference } from "./motionPreference";
import { useApp } from "./context";
import { api, download } from "./api";
import { Byte, Icon, Button, ProgressBar, Modal, Empty } from "./components";
import type { Unit, LessonSummary } from "./types";
import { ProfileLevel, ProfileFrames } from "./Expansion";
import ExpandedShop from "./ExpandedShop";
import { CelebrationScene, LoadingScene } from "./Delight";
import { courseRunner, courseLanguages, languageName, mandatoryLessons, courseIconName } from './courseUI';
export function Home() {
  const { state, course, notify, refresh } = useApp(),
    navigate = useNavigate();
  const next = course.lessons.find((l) => !l.progress?.passed && l.id <= (mandatoryLessons(course)));
  const guidedLesson = course.lessons.find(l => l.unlocked && l.kind !== 'exam' && !l.progress?.passed)
    ?? course.lessons.find(l => l.unlocked && l.kind !== 'exam');
  const [unitId, setUnitId] = useState(next?.unitId || course.units.at(-2)?.id || 1),
    [reward, setReward] = useState<any>(null),
    [claiming, setClaiming] = useState(false);
  const systemReduced = useMotionPreference(), reduced = systemReduced || state.profile.settings?.reducedMotion;
  useEffect(() => { setUnitId(next?.unitId || course.units.at(-2)?.id || 1); }, [course.id]);
  const lastUnitId = course.units.at(-1)?.id || 1;
  const unit = course.units.find((u) => u.id === unitId) || course.units[0];
  const nodes = course.lessons.filter((l) => l.unitId === unitId);
  const offsets = [0, -70, -110, -65, 20, 70, 20, -40, 0];
  const completed = nodes.filter((l) => l.progress?.passed).length;
  const chestRewardId = (course.id === "dsa" ? "" : course.id + ":") + "chest:" + unitId;
  const chestClaimed = state.claimed.includes(chestRewardId);
  return (
    <div className="home">
      <div className="journey-heading">
        <div>
          <span className="eyebrow">KHÓA HỌC CỦA BẠN</span>
          <h1>
            {course.title}
            <span className="title-spark">✦</span>
          </h1>
          <p>Hiểu từng bước. Tự mình giải được.</p>
        </div>
        <Link
          to="/courses"
          className="round-outline"
          aria-label="Chọn khóa học"
        >
          <Icon name="layers" size={26} />
        </Link>
      </div>
      <Link to="/courses" className="new-courses-link"><Icon name="layers" size={19}/><span><strong>Thêm 3 hành trình mới</strong> Docker · Gen AI · RAG LLM</span><Icon name="right" size={17}/></Link>
      {guidedLesson && <section className="teaching-update-banner" aria-label="Bài giảng đã cập nhật">
        <Byte size={74} mood="explaining" skin={state.profile.skin}/>
        <div><span className="eyebrow">BÀI GIẢNG ĐÃ ĐƯỢC LÀM MỚI</span><h2>Nhìn hình, làm thử, rồi viết code</h2><p>Ví dụ từng bước và bổ trợ ngay khi cần. Khi chuyển sang bản mới, code và lượt học cũ vẫn được giữ.</p>
        <Link className="teaching-update-link" to={`/courses/${course.id}/lesson/${guidedLesson.id}?phase=learn&guided=1`}>THỬ CÁCH HỌC MỚI <Icon name="right" size={17}/></Link></div>
      </section>}
      <div className="course-progress">
        <ProgressBar value={state.completed} max={mandatoryLessons(course)} />
        <span>
          <b>{state.completed}</b> / {mandatoryLessons(course)} buổi
        </span>
      </div>
      <div className={`unit-banner ${unit.color}`}>
        <button
          className="banner-arrow"
          onClick={() => setUnitId(Math.max(1, unitId - 1))}
          disabled={unitId === 1}
          aria-label="Chặng trước"
        >
          <Icon name="left" size={23} />
        </button>
        <div>
          <span>
            CHẶNG {unit.id} ·{" "}
            {unit === course.units.at(-1) ? "NÂNG CAO TỰ CHỌN" : `${nodes.length} BUỔI`}
          </span>
          <h2>{unit.title}</h2>
        </div>
        <button
          className="unit-guide"
          aria-label="Chọn chặng"
          onClick={() => {
            const el = document.getElementById(
              "unit-select",
            ) as HTMLSelectElement;
            el?.focus();
          }}
        >
          <Icon name="book" size={22} />
        </button>
        <select
          id="unit-select"
          aria-label="Chọn chặng học"
          value={unitId}
          onChange={(e) => setUnitId(Number(e.target.value))}
        >
          {course.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.id}. {u.title}
            </option>
          ))}
        </select>
      </div>
      <div className="unit-caption">
        <span>{unit.subtitle}</span>
        <span>
          {completed}/{nodes.length} đã đạt
        </span>
      </div>
      <div
        className="learning-path"
        style={{ height: nodes.length * 132 + 160 }}
      >
        <svg
          className="path-connector"
          width="100%"
          height="100%"
          aria-hidden="true"
          viewBox={`0 0 500 ${nodes.length * 132 + 160}`}
          preserveAspectRatio="none"
        >
          <path
            d={
              nodes
                .map(
                  (_, i) =>
                    `${i ? "L" : "M"} ${250 + offsets[i % offsets.length]} ${60 + i * 132}`,
                )
                .join(" ") + ` L 250 ${60 + nodes.length * 132}`
            }
            fill="none"
            stroke="#edf0ec"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {nodes.map((l, i) => {
          const passed = l.progress?.passed,
            current = l.id === next?.id,
            available = l.unlocked;
          return (
            <div
              key={l.id}
              className={`path-stop ${passed ? "passed" : available ? "available" : "locked"}`}
              style={{
                top: 18 + i * 132,
                left: `${50 + offsets[i % offsets.length] / 5}%`,
              }}
            >
              {current && (
                <motion.div
                  className="start-bubble"
                  animate={reduced ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  BẮT ĐẦU
                  <small />
                </motion.div>
              )}
              <button
                className={`lesson-node ${unit.color} ${passed ? "complete" : available ? "open" : "disabled"} ${current ? "current" : ""}`}
                aria-label={`Buổi ${l.id}: ${l.title}${passed ? ", đã đạt" : available ? ", đã mở" : ", chưa mở"}`}
                aria-disabled={!available}
                onClick={() =>
                  available
                    ? navigate(`/courses/${course.id}/lesson/` + l.id)
                    : notify(
                        l.kind === "advanced"
                          ? "Hoàn thành khóa nền tảng và bài cuối khóa để mở phần nâng cao."
                          : `Hoàn thành buổi ${l.id - 1} để mở khóa buổi này.`,
                      )
                }
              >
                <span>
                  {passed ? (
                    <Icon name="check" size={38} />
                  ) : (
                    <Icon
                      name={
                        l.kind === "exam"
                          ? "trophy"
                          : i % 3 === 0
                            ? "star"
                            : i % 3 === 1
                              ? "code"
                              : "book"
                      }
                      size={37}
                    />
                  )}
                </span>
                {passed && (
                  <i className="node-crown">
                    <Icon name="crown" size={15} />
                  </i>
                )}
              </button>
              <div className="stop-label">
                <small>{l.kind === "exam" ? "KIỂM TRA" : "BUỔI " + l.id}</small>
                <strong>{l.title}</strong>
              </div>
            </div>
          );
        })}
        <div className="path-character">
          <Byte size={145} skin={state.profile.skin} />
          <div className="byte-note">
            Mình đi cùng
            <br />
            bạn nhé!
          </div>
          <span className="path-plant plant-one">✦</span>
          <span className="path-plant plant-two">✧</span>
        </div>
        <div className="path-chest" style={{ top: 18 + nodes.length * 132 }}>
          <button
            className={`chest-button ${completed === nodes.length ? "ready" : ""}`}
            aria-label="Mở hộp quà chặng"
            disabled={claiming || chestClaimed}
            aria-busy={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                const r = await api("/courses/" + course.id + "/chests/" + unitId + "/claim", "POST");
                const convertedGems = r.state.lastReward?.id === chestRewardId ? r.state.lastReward.gems : 0;
                setReward({ ...r.reward, gems: r.reward.type === "gems" ? r.reward.amount : convertedGems, freeze: r.reward.type === "freeze" && !convertedGems ? 1 : 0 });
                await refresh();
              } catch (e) {
                notify((e as Error).message);
              } finally { setClaiming(false); }
            }}
          >
            <Icon name="gift" size={48} />
            {chestClaimed && (
              <Icon name="check" size={19} />
            )}
          </button>
          <small>
            {chestClaimed
              ? "ĐÃ NHẬN QUÀ"
              : "HỘP QUÀ CHẶNG"}
          </small>
        </div>
      </div>
      <div className="journey-bottom">
        <Button
          variant="outline"
          onClick={() => setUnitId(Math.min(lastUnitId, unitId + 1))}
          disabled={unitId === lastUnitId}
        >
          CHẶNG TIẾP <Icon name="right" size={18} />
        </Button>
        <Link to={`/courses/${course.id}/capstone`} className="capstone-link">
          <Icon name="graduate" /> Bài cuối khóa{" "}
          {state.capstoneUnlocked ? (
            <Icon name="next" size={18} />
          ) : (
            <Icon name="lock" size={17} />
          )}
        </Link>
      </div>
      <Modal
        open={claiming || !!reward}
        onClose={claiming ? undefined : () => setReward(null)}
        title="Phần thưởng chặng"
        className="reward-event-dialog"
      >
        {claiming ? <LoadingScene title="Đang mở hộp quà" detail="Một bất ngờ nhỏ dành cho chặng đường vừa qua." compact /> : <>
          <CelebrationScene variant="gift" title="Thêm một chặng thật giỏi!" subtitle={reward?.freeze ? "Một vật phẩm bảo vệ streak đã vào túi của bạn." : "Kim cương đã được thêm vào bộ sưu tập."} gems={reward?.gems || undefined} compact>
            {!!reward?.freeze && <div className="reward-open-summary"><Icon name="shield" size={27} /><strong>+{reward.freeze} bảo vệ streak</strong></div>}
          </CelebrationScene>
          <div className="reward-dialog-actions"><Button onClick={() => setReward(null)}>TIẾP TỤC KHÁM PHÁ<Icon name="right" size={19} /></Button></div>
        </>}
      </Modal>
    </div>
  );
}
export function PageHeading({ eyebrow, title, description, icon }: any) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div className="row between">
        <h1>{title}</h1>
        {icon && (
          <span className="heading-icon">
            <Icon name={icon} size={34} />
          </span>
        )}
      </div>
      <p>{description}</p>
    </div>
  );
}
export function Review() {
  const { state, course } = useApp(),
    [data, setData] = useState<any>(null);
  useEffect(() => {
    api("/review?courseId=" + course.id).then(setData);
  }, [state.completed, course.id]);
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="GHI NHỚ LÂU HƠN"
        title="Một chút ôn tập"
        description="Quay lại những ý tưởng quen, để lần sau bạn giải tự tin hơn."
        icon="target"
      />
      <div className="review-banner">
        <Byte size={110} />
        <div>
          <h3>Ôn miễn phí. Năng lượng mới.</h3>
          <p>
            Mỗi lượt đạt hồi 5 năng lượng. Nhận 10 XP cho 5 lượt đầu mỗi ngày.
          </p>
          <span className="pill">
            <Icon name="zap" size={15} /> +5 năng lượng
          </span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Gợi ý cho bạn</h2>
        <span>Nhịp ôn: 1 · 3 · 7 · 14 ngày</span>
      </div>
      {data?.items.map((l: any) => (
        <Link
          key={l.id}
          to={`/courses/${course.id}/lesson/${l.id}?mode=review`}
          className="lesson-list-row"
        >
          <span className="list-icon">
            <Icon name={l.mistakes ? "target" : "refresh"} size={24} />
          </span>
          <div>
            <small>
              BUỔI {l.id} {l.mistakes > 0 ? `· ${l.mistakes} ý cần ôn` : ""}
            </small>
            <h3>{l.title}</h3>
            <p>
              {l.due <= Date.now()
                ? "Sẵn sàng ôn hôm nay"
                : `Ôn tiếp ${new Date(l.due).toLocaleDateString("vi-VN", { timeZone: "Asia/Saigon" })}`}
            </p>
          </div>
          <Icon name="next" />
        </Link>
      ))}
    </div>
  );
}
export function PracticeHub() {
  const { course } = useApp();
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="THỬ, SAI, RỒI HIỂU"
        title="Phòng thực hành"
        description="Viết code, xem test và luyện với dữ liệu mới. Không giới hạn lượt làm lại."
        icon="code"
      />
      {course.units.map((u) => (
        <section key={u.id} className="practice-unit">
          <h2>
            <Icon name={courseIconName(u.icon)} size={23} /> {u.title}
          </h2>
          {course.lessons
            .filter((l) => l.unitId === u.id && l.kind !== "exam")
            .map((l) => (
              <div
                className={`lesson-list-row ${!l.unlocked ? "muted" : ""}`}
                key={l.id}
              >
                <span className="lesson-number">
                  {String(l.id).padStart(2, "0")}
                </span>
                <div>
                  <h3>{l.title}</h3>
                  <small>{l.problemIds.length} bài thực hành · {courseLanguages(course).map(l=>languageName[l]).join(' / ')}</small>
                </div>
                {l.unlocked ? (
                  <Link className="text-link" to={`/courses/${course.id}/lesson/${l.id}?phase=code`}>
                    LUYỆN <Icon name="next" size={16} />
                  </Link>
                ) : (
                  <Icon name="lock" size={18} />
                )}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
export function League() {
  const { state, refresh } = useApp();
  useEffect(() => {
    const timer = setInterval(() => refresh(), 60000);
    return () => clearInterval(timer);
  }, []);
  const rank = state.leagueRows.find((r) => !r.isBot)?.rank ?? 20;
  return (
    <div className="wide-page league-page">
      <PageHeading
        eyebrow="THÊM MỘT CHÚT ĐỘNG LỰC"
        title={`Giải đấu ${state.tierName}`}
        description="Mỗi bài học là một bước tiến. Cùng Byte giữ nhịp tuần này nhé."
        icon="trophy"
      />
      <div className="league-hero">
        <div className="league-medal">
          <Icon name="shield" size={76} />
          <Icon name="trophy" size={33} />
        </div>
        <div>
          <span className="pill">GIẢI ĐẤU MÔ PHỎNG</span>
          <h2>Bạn đang ở hạng #{rank}</h2>
          <p>
            Top 5 lên hạng · cuối 5 xuống hạng
            <br />
            Một tuần mới bắt đầu vào thứ Hai.
          </p>
        </div>
        <Byte size={130} mood="celebrate" skin={state.profile.skin} />
      </div>
      <p className="simulation-note">
        <Icon name="info" size={18} /> 19 nhân vật ảo kiếm XP theo lịch mô phỏng
        cố định trong tuần. Không có người chơi thật.
      </p>
      <div className="rank-table">
        <div className="rank-caption">
          <span>NGƯỜI HỌC</span>
          <span>XP TUẦN NÀY</span>
        </div>
        {state.leagueRows.map((r) => (
          <div
            className={`rank-row ${!r.isBot ? "you" : ""} ${r.rank <= 5 ? "promotion" : r.rank >= 16 ? "demotion" : ""}`}
            key={r.id}
          >
            <span className={`rank-number rank-${r.rank}`}>
              {r.rank <= 3 ? <Icon name="trophy" size={22} /> : r.rank}
            </span>
            <span className={`avatar avatar-${r.avatar}`}>
              {r.isBot ? r.name.slice(0, 1) : <Icon name="code" size={24} />}
            </span>
            <div className="rank-name">
              <strong>
                {r.name}
                {!r.isBot ? " · Bạn" : ""}
              </strong>
              <small>
                {r.isBot ? "Nhân vật mô phỏng" : "Tiến bộ thật của bạn"}
              </small>
            </div>
            <span className="rank-xp">
              {r.xp} <small>XP</small>
            </span>
            {r.rank <= 5 ? (
              <Icon name="up" className="green-text" size={17} />
            ) : r.rank >= 16 ? (
              <Icon name="down" className="muted-text" size={17} />
            ) : (
              <span className="rank-dash">—</span>
            )}
          </div>
        ))}
      </div>
      <div className="league-tier-list">
        {["Đồng", "Bạc", "Vàng", "Ruby", "Kim cương"].map((t, i) => (
          <span className={state.league.tier === i ? "selected" : ""} key={t}>
            <Icon name="shield" size={23} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
export function Quests() {
  const { state, refresh, notify } = useApp();
  const [reward, setReward] = useState<number | null>(null),
    [claiming, setClaiming] = useState(false),
    eligible = state.quests.every((q) => q.current >= q.target),
    claimed = state.claimed.includes("quest:" + state.today);
  const systemReduced = useMotionPreference(), reduced = systemReduced || state.profile.settings?.reducedMotion;
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="NHỮNG CHIẾN THẮNG NHỎ"
        title="Nhiệm vụ hôm nay"
        description="Ba điều nhỏ để xây dựng một thói quen lớn."
        icon="gift"
      />
      <div className="quest-reward">
        <div className="gift-illustration">
          <Icon name="gift" size={74} />
          <span>✦</span>
        </div>
        <div>
          <span className="eyebrow">QUÀ HOÀN THÀNH</span>
          <h2>15 gem đang chờ bạn</h2>
          <p>Hoàn thành cả ba nhiệm vụ trong ngày.</p>
          <Button
            disabled={!eligible || claimed}
            busy={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                const result = await api("/quests/claim", "POST", {});
                setReward(result.lastReward?.id === "quest:" + state.today ? result.lastReward.gems : Math.max(0, result.gems - state.gems));
                await refresh();
              } catch (e) {
                notify((e as Error).message);
              } finally { setClaiming(false); }
            }}
          >
            {claimed ? "ĐÃ NHẬN QUÀ" : "NHẬN PHẦN THƯỞNG"}
          </Button>
        </div>
      </div>
      <div className="quest-list">
        {state.quests.map((q) => (
          <motion.div className={`quest-full ${q.current >= q.target ? "quest-complete" : ""}`} key={q.id} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .25 }}>
            <span className={`quest-symbol ${q.id}`}>
              <Icon name={q.icon} size={34} />
            </span>
            <div>
              <div className="row between">
                <h3>{q.title}</h3>
                <b>
                  {q.current}/{q.target}
                </b>
              </div>
              <ProgressBar value={q.current} max={q.target} />
            </div>
            {q.current >= q.target ? (
              <motion.span className="quest-done-burst" initial={reduced ? false : { scale: .6 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 11 }} aria-label="Nhiệm vụ hoàn thành"><Icon name="success" className="green-text" /></motion.span>
            ) : (
              <Link
                to={
                  q.id === "review"
                    ? "/review"
                    : q.id === "code"
                      ? "/practice"
                      : "/"
                }
                className="icon-button"
                aria-label="Làm nhiệm vụ"
              >
                <Icon name="next" />
              </Link>
            )}
          </motion.div>
        ))}
      </div>
      <div className="soft-note">
        <Icon name="clock" /> Nhiệm vụ làm mới lúc 00:00 theo giờ Việt Nam. Phần
        thưởng không thay đổi điểm kiểm tra.
      </div>
      <Modal open={claiming || reward !== null} onClose={claiming ? undefined : () => setReward(null)} title="Quà nhiệm vụ ngày" className="reward-event-dialog">
        {claiming ? <LoadingScene title="Đang chuẩn bị quà của bạn" detail="Ba nhiệm vụ nhỏ, một thói quen lớn." compact /> : <>
          <CelebrationScene variant="gift" title="Bạn đã làm được cả ba!" subtitle="Mỗi ngày một chút. Kiến thức thêm vững vàng." gems={reward ?? undefined} compact />
          <div className="reward-dialog-actions"><Button onClick={() => setReward(null)}>TUYỆT VỜI<Icon name="check" size={19} /></Button></div>
        </>}
      </Modal>
    </div>
  );
}
export function Shop() { return <ExpandedShop />; }
const badgeDefs = [
  [
    "debugger",
    "Người sửa lỗi",
    "puzzle",
    "Sửa một bài code đã chấm sai và nộp lại đạt",
  ],
  [
    "edge-master",
    "Không bỏ sót góc nhỏ",
    "shield",
    "Qua bộ chấm đầy đủ có test biên",
  ],
  ["first-code", "Dòng code đầu tiên", "code", "Giải đúng một bài lập trình"],
  ["checkpoint-13", "Nền tảng vững vàng", "sprout", "Qua kiểm tra nền tảng"],
  [
    "checkpoint-26",
    "Kết nối ý tưởng",
    "link",
    "Qua kiểm tra cấu trúc tuyến tính",
  ],
  [
    "checkpoint-38",
    "Người nhận diện mẫu",
    "puzzle",
    "Qua kiểm tra kỹ thuật giải bài",
  ],
  ["checkpoint-48", "Sẵn sàng xây dựng", "rocket", "Qua kiểm tra tổng hợp"],
  ["streak7", "Một tuần đều đặn", "flame", "Học 7 ngày liên tiếp"],
  ["streak30", "Thói quen lớn", "flame", "Học 30 ngày liên tiếp"],
  ["graduate", "Nhà khám phá DSA", "graduate", "Hoàn thành bài cuối khóa"],
];
export function Profile() {
  const { state, refresh, notify, health, course } = useApp();
  const systemReduced = useMotionPreference(), reduced = systemReduced || state.profile.settings?.reducedMotion;
  const [settings, setSettings] = useState(state.profile.settings || {});
  const pendingSettings = useRef(0);
  useEffect(() => { if (!pendingSettings.current) setSettings(state.profile.settings || {}); }, [state.profile.settings]);
  async function updateSetting(key: "sound" | "reducedMotion", value: boolean) {
    const previous = settings[key];
    pendingSettings.current++;
    setSettings(current => ({ ...current, [key]: value }));
    try {
      await api("/profile", "PUT", { ...state.profile, settings: { [key]: value } });
      await refresh();
    } catch (err) {
      setSettings(current => ({ ...current, [key]: previous }));
      notify((err as Error).message);
    } finally { pendingSettings.current--; }
  }
  const allBadges = [
    ...badgeDefs,
    ...course.units
      .filter((u) => u.range[0] <= (mandatoryLessons(course)))
      .map((u) => [
        "chapter-" + u.id,
        "Chặng " + u.id,
        courseIconName(u.icon),
        "Hoàn thành " + u.title,
      ]),
  ];
  const [name, setName] = useState(state.profile.name),
    [goal, setGoal] = useState(state.profile.dailyGoal),
    [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api("/profile", "PUT", { ...state.profile, name, dailyGoal: goal });
      await refresh();
      notify("Đã lưu thiết lập.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA RIÊNG BẠN"
        title="Hồ sơ học tập"
        description="Mỗi điều bạn hiểu được đều là một bước tiến."
        icon="user"
      />
      <div className="profile-hero">
        <div className={`profile-avatar ${state.profile.avatarFrame || ""}`}><Byte size={145} skin={state.profile.skin} /></div>
        <div>
          <h2>{state.profile.name}</h2>
          <p>Nhà khám phá · Giải đấu {state.tierName}</p>
          <div className="profile-stats">
            <span>
              <Icon name="flame" />
              {state.streak} ngày
            </span>
            <span>
              <Icon name="star" />
              {state.xp} XP
            </span>
            <span>
              <Icon name="book" />
              {state.completed}/{mandatoryLessons(course)} buổi
            </span>
          </div>
        </div>
      </div>
      <div className="profile-progress">
        <h3>Mức hoàn thành khóa</h3>
        <ProgressBar value={state.completed} max={mandatoryLessons(course)} />
        <p>
          Điểm khóa hiện tại: <b>{state.courseScore}/100</b> · Bài cuối khóa:{" "}
          {state.capstonePassed
            ? "Đã đạt"
            : state.capstoneScore
              ? `${state.capstoneScore}/100`
              : "Chưa hoàn thành"}
        </p>
      </div>
      <section>
        <div className="section-heading">
          <h2>Bộ sưu tập huy hiệu</h2>
          <span>{state.badges.length} đã mở</span>
        </div>
        <div className="badge-grid">
          {allBadges.map(([id, title, icon, desc]) => (
            <motion.div
              key={id}
              className={`badge-item ${state.badges.includes(id) ? "earned" : ""}`}
              title={desc}
              whileHover={state.badges.includes(id) && !reduced ? { y: -4 } : undefined}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
            >
              <div>
                <Icon name={icon} size={31} />
              </div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </motion.div>
          ))}
        </div>
      </section>
      <ProfileLevel />
      <ProfileFrames />
      <section className="settings-section">
        <h2>Nhịp học của bạn</h2>
        <label className="setting-toggle">
          <input type="checkbox" checked={!!settings.sound} onChange={e => void updateSetting("sound", e.target.checked)} />
          Âm thanh thành tích
        </label>
        <label className="setting-toggle">
          <input type="checkbox" checked={!!settings.reducedMotion} onChange={e => void updateSetting("reducedMotion", e.target.checked)} />
          Giảm chuyển động
        </label>
        <Link to="/effects" className="text-link effect-preview-link"><Icon name="sparkles" size={18} /> Xem thử hiệu ứng của Byte <Icon name="right" size={16} /></Link>
        <label>
          Tên hiển thị
          <input
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Mục tiêu mỗi ngày
          <select
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          >
            {[20, 50, 100, 150, 200].map((v) => (
              <option key={v} value={v}>
                {v} XP
              </option>
            ))}
          </select>
        </label>
        <Button onClick={save} busy={busy}>
          LƯU THIẾT LẬP
        </Button>
      </section>
      <section className="settings-section">
        <h2>Dữ liệu luôn ở cùng bạn</h2>
        <p>
          {health?.mode === "cloud"
            ? "Tiến độ lưu trên server BytePath."
            : "Tiến độ lưu trong SQLite trên máy."}{" "}
          Xuất bản sao trước khi chuyển nơi chạy hoặc khôi phục dữ liệu.
        </p>
        <div className="row wrap">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                download(
                  "bytepath-backup-" + state.today + ".json",
                  JSON.stringify(await api("/data/export"), null, 2),
                );
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Icon name="download" size={19} /> XUẤT BẢN SAO
          </Button>
          <label className="btn outline import-label">
            <Icon name="upload" size={19} /> KHÔI PHỤC BẢN SAO
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const content = JSON.parse(await f.text());
                  if (
                    !window.confirm(
                      "Khôi phục sẽ thay thế tiến độ hiện tại bằng bản sao đã chọn.",
                    )
                  )
                    return;
                  await api("/data/import", "POST", content);
                  await refresh();
                  notify("Đã khôi phục bản sao.");
                } catch (err) {
                  notify((err as Error).message);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="system-health">
          <span>
            <i className={courseRunner(health,course)?.available ? "online" : "offline"} /> Bộ
            chạy {course.id.toUpperCase()}: {courseRunner(health,course)?.available ? "Sẵn sàng" : "Chưa sẵn sàng"}
          </span>
          <span>
            <i className={health?.ai.available ? "online" : "offline"} /> Trợ
            giảng AI:{" "}
            {health?.ai.available
              ? health.ai.provider === "gemini"
                ? "Gemini Free Tier"
                : "Ollama local"
              : "Gợi ý soạn sẵn"}
          </span>
        </div>
        <small>
          Chấm điểm không phụ thuộc AI. Gợi ý trong bài luôn dùng được.
        </small>
        {health?.mode === "cloud" && (
          <Button
            variant="outline"
            onClick={async () => {
              await api("/auth/logout", "POST", {});
              window.location.reload();
            }}
          >
            ĐĂNG XUẤT <Icon name="shield" size={18} />
          </Button>
        )}
      </section>
    </div>
  );
}
export function Sources() {
  const { course } = useApp();
  const [data, setData] = useState<any>(null),
    [query, setQuery] = useState(""),
    [image, setImage] = useState<any>(null),
    [tab, setTab] = useState("images");
  useEffect(() => {
    api("/sources?courseId=" + course.id).then(setData);
  }, [course.id]);
  const names: Record<string, string> = {
    interview: "Bài phỏng vấn",
    notes: "Ghi chú",
    patterns: "Mẫu giải bài",
    roadmap: "Roadmap & tư duy",
  };
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="NỀN TẢNG CỦA KHÓA HỌC"
        title={"Thư viện " + course.id.toUpperCase()}
        description={`${data?.sources?.length ?? course.sourceCount ?? 'Các'} ảnh gốc và nội dung hiệu đính có thể đối chiếu.`}
        icon="bookmark"
      />
      <div className="tabs">
        <button
          className={tab === "images" ? "active" : ""}
          onClick={() => setTab("images")}
        >
          Ảnh nguồn <span>{data?.sources?.length || 0}</span>
        </button>
        <button
          className={tab === "corrections" ? "active" : ""}
          onClick={() => setTab("corrections")}
        >
          Sổ hiệu đính <span>{data?.corrections.length ?? 8}</span>
        </button>
      </div>
      {tab === "images" ? (
        <>
          <div className="search-field">
            <Icon name="search" size={20} />
            <input
              placeholder="Tìm chủ đề hoặc mã tài liệu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="source-grid">
            {data?.sources
              .filter((s: any) =>
                (s.topic + " " + s.id)
                  .toLocaleLowerCase("vi")
                  .includes(query.toLocaleLowerCase("vi")),
              )
              .map((s: any) => (
                <button
                  className="source-item"
                  key={s.id}
                  onClick={() => setImage(s)}
                >
                  <div>
                    <img
                      loading="lazy"
                      src={s.url || "/sources/" + s.file}
                      alt={s.topic}
                    />
                  </div>
                  <span>
                    {s.id} · {names[s.collection] || s.collection}
                  </span>
                  <strong>{s.topic}</strong>
                  <small>Trang {s.page || "bìa"}</small>
                </button>
              ))}
          </div>
        </>
      ) : (
        <div className="correction-list">
          {data?.corrections.map((c: any) => (
            <article key={c.id}>
              <span className="pill">
                <Icon name="shield" size={15} /> ĐÃ HIỆU ĐÍNH
              </span>
              <h2>{c.title}</h2>
              <div className="correction-before">
                <small>TRONG ẢNH GỐC</small>
                <p>{c.before}</p>
              </div>
              <div className="correction-after">
                <small>NỘI DUNG ĐƯỢC DẠY</small>
                <p>{c.after}</p>
                {c.test && <pre>{c.test}</pre>}
              </div>
              <button
                className="text-link"
                onClick={() =>
                  setImage(data.sources.find((s: any) => s.prefix === c.source))
                }
              >
                ĐỐI CHIẾU ẢNH GỐC <Icon name="next" size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
      <Modal open={!!image} onClose={() => setImage(null)} title={image?.topic}>
        <h3>{image?.topic}</h3>
        <p className="muted-text">
          {image?.id} · Trang {image?.page || "bìa"} · Ảnh gốc giữ nguyên
        </p>
        {image && (
          <img
            className="source-full"
            src={image.url || "/sources/" + image.file}
            alt={image.topic}
          />
        )}
      </Modal>
    </div>
  );
}
