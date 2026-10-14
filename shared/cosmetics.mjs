// BytePath's original vector characters. IDs are stable save-data identifiers.
const robot = (id, name, body, accent, price, unlock = { type: "shop" }) => ({
  id, name, family: "robot", variant: unlock.type === "level" || unlock.type === "course" ? "rare" : "base",
  colors: { body, accent, light: "#f5fff4" }, price, unlock,
  description: `${name} cùng bạn khám phá từng điều mới.`, type: "skin",
});
const animal = (family, name, body, accent, level) => [
  { id: family, name, family, variant: "base", colors: { body, accent, light: "#fff9f0" }, price: 150, unlock: { type: "shop" }, type: "skin", description: "Một người bạn nhỏ cho hành trình học." },
  { id: `${family}-outfit`, name: `${name} dã ngoại`, family, variant: "outfit", colors: { body, accent, light: "#fff9f0" }, price: 300, unlock: { type: "shop" }, type: "skin", description: "Trang phục riêng và biểu cảm vui nhộn." },
  { id: `${family}-rare`, name: ({ cat: "Mèo trăng", fox: "Cáo thu", rabbit: "Thỏ mây", axolotl: "Axolotl sao" })[family], family, variant: "rare", colors: { body, accent, light: "#fff9f0" }, price: null, unlock: { type: "level", level }, type: "skin", description: `Quà độc quyền khi đạt cấp ${level}.` },
];
export const cosmetics = [
  {id:"bitty",name:"Bitty",family:"bitty",variant:"base",colors:{body:"#76DEC1",accent:"#3AA58E",light:"#FFF9E9"},price:0,unlock:{type:"free"},type:"skin",description:"Mèo robot tròn trịa: cùng bạn học, debug và ăn mừng."},
  robot("original", "Byte xanh lá", "#78c800", "#2b7a26", 0, { type: "free" }),
  robot("ocean", "Byte đại dương", "#54bde8", "#247daf", 100),
  robot("sunset", "Byte hoàng hôn", "#ffa454", "#e26b25", 200),
  robot("cosmic", "Byte vũ trụ", "#ab8cff", "#7054bd", 300),
  robot("mint", "Byte bạc hà", "#80ded0", "#199d87", 200),
  robot("neon", "Byte đom đóm", "#a7e572", "#6677cc", 300),
  robot("pixel", "Byte thám hiểm", "#f7c757", "#c78038", 400),
  robot("aurora", "Byte cực quang", "#74c7ed", "#bb77d5", 500),
  robot("scholar", "Robot học giả", "#72be72", "#6050a1", null, { type: "level", level: 5 }),
  robot("rainbow", "Robot cầu vồng", "#99dbe5", "#d775a4", null, { type: "level", level: 30 }),
  robot("algorithm", "Byte thuật toán", "#7baaf0", "#d89d46", null, { type: "course", courseId: "dsa" }),
  robot("scientist", "Byte nhà khoa học", "#b5e6ce", "#775ab9", null, { type: "course", courseId: "ml" }),
  ...animal("cat", "Mèo Mây", "#f5d8ac", "#d49279", 20),
  ...animal("fox", "Cáo Cam", "#ffb66f", "#c76843", 15),
  ...animal("rabbit", "Thỏ Bông", "#f7e4ef", "#df92b5", 10),
  ...animal("axolotl", "Axolotl Búp", "#f5bdd5", "#db7dac", 25),
];
export const cosmeticById = Object.fromEntries(cosmetics.map((item) => [item.id, item]));
export const boostPacks = [
  { id: "boost-2", name: "X2 XP · 2 lượt", description: "Nhân đôi XP của 2 lượt được thưởng.", type: "boost", charges: 2, price: 40 },
  { id: "boost-5", name: "X2 XP · 5 lượt", description: "Nhân đôi XP của 5 lượt được thưởng.", type: "boost", charges: 5, price: 90 },
  { id: "boost-10", name: "X2 XP · 10 lượt", description: "Nhân đôi XP của 10 lượt được thưởng.", type: "boost", charges: 10, price: 160 },
];
export const extendedShop = [...cosmetics.filter((item) => item.unlock.type === "shop"), ...boostPacks];
export const avatarFrameIds = ["frame-leaf", "frame-wave", "frame-star", "frame-moon", "frame-prism"];
