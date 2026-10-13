import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useApp } from "./context";
import { api, download } from "./api";
import { Byte, Icon, Button, ProgressBar, Modal, Empty } from "./components";
import type { Unit, LessonSummary } from "./types";
export function Home() {
  const { state, course, notify, refresh } = useApp(),
    navigate = useNavigate();
  const next = course.lessons.find((l) => !l.progress?.passed && l.id <= 48);
  const [unitId, setUnitId] = useState(next?.unitId || 11),
    [reward, setReward] = useState<any>(null);
  const unit = course.units.find((u) => u.id === unitId)!;
  const nodes = course.lessons.filter((l) => l.unitId === unitId);
  const offsets = [0, -70, -110, -65, 20, 70, 20, -40, 0];
  const completed = nodes.filter((l) => l.progress?.passed).length;
  return (
    <div className="home">
      <div className="journey-heading">
        <div>
          <span className="eyebrow">KHÓA HỌC CỦA BẠN</span>
          <h1>
            Cấu trúc dữ liệu
            <br className="desktop-br" /> & thuật toán
            <span className="title-spark">✦</span>
          </h1>
          <p>Hiểu từng bước. Tự mình giải được.</p>
        </div>
        <Link
          to="/practice"
          className="round-outline"
          aria-label="Mở phòng thực hành"
        >
          <Icon name="code" size={26} />
        </Link>
      </div>
      <div className="course-progress">
        <ProgressBar value={state.completed} max={48} />
        <span>
          <b>{state.completed}</b> / 48 buổi
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
            {unit.id === 12 ? "NÂNG CAO TỰ CHỌN" : `${nodes.length} BUỔI`}
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
                  animate={{ y: [0, -4, 0] }}
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
                    ? navigate("/lesson/" + l.id)
                    : notify(
                        l.id > 48
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
            onClick={async () => {
              try {
                const r = await api("/chests/" + unitId + "/claim", "POST");
                setReward(r.reward);
                await refresh();
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Icon name="gift" size={48} />
            {state.claimed.includes("chest:" + unitId) && (
              <Icon name="check" size={19} />
            )}
          </button>
          <small>
            {state.claimed.includes("chest:" + unitId)
              ? "ĐÃ NHẬN QUÀ"
              : "HỘP QUÀ CHẶNG"}
          </small>
        </div>
      </div>
      <div className="journey-bottom">
        <Button
          variant="outline"
          onClick={() => setUnitId(Math.min(12, unitId + 1))}
          disabled={unitId === 12}
        >
          CHẶNG TIẾP <Icon name="right" size={18} />
        </Button>
        <Link to="/capstone" className="capstone-link">
          <Icon name="graduate" /> Bài cuối khóa{" "}
          {state.capstoneUnlocked ? (
            <Icon name="next" size={18} />
          ) : (
            <Icon name="lock" size={17} />
          )}
        </Link>
      </div>
      <Modal
        open={!!reward}
        onClose={() => setReward(null)}
        title="Phần thưởng chặng"
      >
        <div className="reward-modal">
          <Byte mood="celebrate" size={180} />
          <h2>Một chặng đường tuyệt vời!</h2>
          <p>
            {reward?.type === "gems"
              ? `Bạn nhận được ${reward.amount} gem.`
              : "Bạn nhận một vật phẩm bảo vệ streak (hoặc 10 gem khi túi đã đầy)."}
          </p>
          <Button onClick={() => setReward(null)}>TIẾP TỤC KHÁM PHÁ</Button>
        </div>
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
  const { state } = useApp(),
    [data, setData] = useState<any>(null);
  useEffect(() => {
    api("/review").then(setData);
  }, [state.completed]);
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
          to={`/lesson/${l.id}?mode=review`}
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
            <Icon name={u.icon} size={23} /> {u.title}
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
                  <small>{l.problemIds.length} bài code · Python / C++</small>
                </div>
                {l.unlocked ? (
                  <Link className="text-link" to={`/lesson/${l.id}?phase=code`}>
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
  const [reward, setReward] = useState(false),
    eligible = state.quests.every((q) => q.current >= q.target),
    claimed = state.claimed.includes("quest:" + state.today);
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
            onClick={async () => {
              try {
                await api("/quests/claim", "POST", {});
                await refresh();
                setReward(true);
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            {claimed ? "ĐÃ NHẬN QUÀ" : "NHẬN PHẦN THƯỞNG"}
          </Button>
        </div>
      </div>
      <div className="quest-list">
        {state.quests.map((q) => (
          <div className="quest-full" key={q.id}>
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
              <Icon name="success" className="green-text" />
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
          </div>
        ))}
      </div>
      <div className="soft-note">
        <Icon name="clock" /> Nhiệm vụ làm mới lúc 00:00 theo giờ Việt Nam. Phần
        thưởng không thay đổi điểm kiểm tra.
      </div>
      <Modal open={reward} onClose={() => setReward(false)} title="Nhận gem">
        <div className="reward-modal">
          <Byte size={180} mood="celebrate" />
          <h2>Bạn đã làm được!</h2>
          <div className="big-gem">
            <Icon name="gem" size={32} /> +15 gem
          </div>
          <Button onClick={() => setReward(false)}>TUYỆT VỜI</Button>
        </div>
      </Modal>
    </div>
  );
}
export function Shop() {
  const { state, refresh, notify } = useApp(),
    [data, setData] = useState<any>(null),
    [busy, setBusy] = useState("");
  useEffect(() => {
    api("/shop").then(setData);
  }, []);
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="GÓC NHỎ CỦA BYTE"
        title="Cửa hàng"
        description="Đổi những nỗ lực của bạn thành một chút niềm vui."
        icon="shop"
      />
      <div className="wallet">
        <div>
          <Icon name="gem" size={34} />
          <span>
            <b>{state.gems}</b> gem
          </span>
        </div>
        <span>Kiếm gem bằng học và hoàn thành nhiệm vụ.</span>
      </div>
      <section className="shop-section">
        <h2>Nạp lại để tiếp tục</h2>
        {data?.items
          .filter((i: any) => i.type !== "skin")
          .map((item: any) => (
            <div className="shop-item" key={item.id}>
              <span className={`shop-item-icon ${item.type}`}>
                <Icon
                  name={item.type === "energy" ? "zap" : "shield"}
                  size={44}
                />
              </span>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                {item.type === "energy" ? (
                  <small>Bạn có {state.energy}/30 năng lượng</small>
                ) : (
                  <small>Bạn có {state.freeze}/2 vật phẩm</small>
                )}
              </div>
              <Button
                busy={busy === item.id}
                variant="outline"
                disabled={
                  state.gems < item.price ||
                  (item.type === "energy" && state.energy === 30) ||
                  (item.type === "freeze" && state.freeze === 2)
                }
                onClick={async () => {
                  setBusy(item.id);
                  try {
                    await api("/shop/buy", "POST", { itemId: item.id });
                    await refresh();
                    notify("Vật phẩm đã vào túi của bạn!");
                  } catch (e) {
                    notify((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <Icon name="gem" size={19} />
                {item.price}
              </Button>
            </div>
          ))}
      </section>
      <section className="shop-section">
        <h2>Một diện mạo mới</h2>
        <p>Byte vẫn là Byte, với bộ áo bạn yêu thích.</p>
        <div className="skin-grid">
          {[
            { id: "original", name: "Byte nguyên bản", price: 0 },
            ...(data?.items.filter((i: any) => i.type === "skin") ?? []),
          ].map((item: any) => {
            const owned = state.inventory.includes(item.id),
              selected = state.profile.skin === item.id;
            return (
              <div
                className={`skin-item ${selected ? "equipped" : ""}`}
                key={item.id}
              >
                <Byte size={140} skin={item.id} />
                <h3>{item.name}</h3>
                <Button
                  variant={selected ? "soft" : "outline"}
                  busy={busy === item.id}
                  disabled={selected || (!owned && state.gems < item.price)}
                  onClick={async () => {
                    setBusy(item.id);
                    try {
                      if (!owned)
                        await api("/shop/buy", "POST", { itemId: item.id });
                      else
                        await api("/profile", "PUT", {
                          ...state.profile,
                          skin: item.id,
                        });
                      await refresh();
                      notify(
                        owned
                          ? "Byte đã thay áo mới!"
                          : "Bộ áo đã vào túi. Chọn để mặc cho Byte.",
                      );
                    } catch (e) {
                      notify((e as Error).message);
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {selected ? (
                    <>
                      <Icon name="check" size={16} /> ĐANG MẶC
                    </>
                  ) : owned ? (
                    "MẶC CHO BYTE"
                  ) : (
                    <>
                      <Icon name="gem" size={16} />
                      {item.price}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
      <details className="soft-note">
        <summary>Hộp quà chặng có gì?</summary>
        <p>
          5 gem: 50% · 10 gem: 30% · 20 gem: 15% · 1 bảo vệ streak: 5%. Nếu đã
          đủ 2 bảo vệ, nhận 10 gem. Mỗi hộp mở một lần.
        </p>
      </details>
    </div>
  );
}
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
  const allBadges = [
    ...badgeDefs,
    ...course.units
      .filter((u) => u.range[0] <= 48)
      .map((u) => [
        "chapter-" + u.id,
        "Chặng " + u.id,
        u.icon,
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
        <Byte size={145} skin={state.profile.skin} />
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
              {state.completed}/48 buổi
            </span>
          </div>
        </div>
      </div>
      <div className="profile-progress">
        <h3>Mức hoàn thành khóa</h3>
        <ProgressBar value={state.completed} max={48} />
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
            <div
              key={id}
              className={`badge-item ${state.badges.includes(id) ? "earned" : ""}`}
              title={desc}
            >
              <div>
                <Icon name={icon} size={31} />
              </div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h2>Nhịp học của bạn</h2>
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
            <i className={health?.runner.available ? "online" : "offline"} /> Bộ
            chạy code: {health?.runner.available ? "Sẵn sàng" : "Chưa sẵn sàng"}
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
  const [data, setData] = useState<any>(null),
    [query, setQuery] = useState(""),
    [image, setImage] = useState<any>(null),
    [tab, setTab] = useState("images");
  useEffect(() => {
    api("/sources").then(setData);
  }, []);
  const names: Record<string, string> = {
    interview: "30 bài phỏng vấn",
    notes: "Ghi chú DSA",
    patterns: "Pattern DSA",
    roadmap: "Roadmap & tư duy",
  };
  return (
    <div className="wide-page">
      <PageHeading
        eyebrow="NỀN TẢNG CỦA KHÓA HỌC"
        title="Thư viện DSA"
        description="62 ảnh gốc, nội dung đã hệ thống hóa và sổ hiệu đính có thể đối chiếu."
        icon="bookmark"
      />
      <div className="tabs">
        <button
          className={tab === "images" ? "active" : ""}
          onClick={() => setTab("images")}
        >
          Ảnh nguồn <span>62</span>
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
              placeholder="Tìm cây, đồ thị, mảng, DP…"
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
                      src={"/sources/" + s.file}
                      alt={s.topic}
                    />
                  </div>
                  <span>
                    {s.id} · {names[s.collection]}
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
            src={"/sources/" + image.file}
            alt={image.topic}
          />
        )}
      </Modal>
    </div>
  );
}
