// Writes rooms.json, the one list of room names, from the room data in floorplan.html.
// Calendar titles and booking forms (GPCC Forms) use `name`; the floor plan shows `floorName`.
// Usage: node scripts/rooms.mjs          (write rooms.json)
//        node scripts/rooms.mjs --check  (exit 1 if rooms.json is out of date)
import { readFileSync, writeFileSync } from "node:fs";

// Short, unique names for scheduling. Every room in floorplan.html needs one.
const NAMES = {
  "ll-kitchen": "LL Kitchen", "ll-g1": "G1", "ll-g2": "G2", "ll-g3": "G3", "ll-g4": "G4",
  "ll-loading": "Loading Dock", "ll-mech": "Mechanical Room",
  "1-auditorium": "Auditorium", "1-stage": "Stage", "1-kitchen": "1F Kitchen", "1-classroom": "Room 1",
  "1-office-lg": "1F Office (Large)", "1-office-md": "1F Office (Medium)", "1-office-sm": "1F Office (Small)",
  "2-room2": "Room 2", "2-room3": "Room 3", "2-room4": "Room 4", "2-room5": "Room 5", "2-room6": "Room 6",
  "2-room7": "Room 7", "2-room8": "Room 8", "2-office": "2F Office",
  "roof-current": "Roof Deck", "roof-future": "Roof (future)", "common-roof": "Roof",
  "common-stairwell": "Stairwell", "common-foyer": "Hallway",
};
const NOT_BOOKABLE = new Set(["ll-mech", "roof-future", "common-roof", "common-stairwell", "common-foyer"]);

const html = readFileSync(new URL("../floorplan.html", import.meta.url), "utf8");
const start = html.indexOf("const rooms = {");
if (start < 0) throw new Error("floorplan.html: `const rooms = {` not found");
let depth = 0, a = start + "const rooms = ".length, b = -1;
for (let k = a; k < html.length; k++) {
  if (html[k] === "{") depth++;
  if (html[k] === "}" && --depth === 0) { b = k + 1; break; }
}
const rooms = new Function(`return (${html.slice(a, b)})`)();

const out = {
  _about: "Room index for The School. Generated from floorplan.html by scripts/rooms.mjs; edit names there.",
  rooms: Object.entries(rooms).map(([id, r]) => {
    if (!NAMES[id]) throw new Error(`room ${id} has no short name in scripts/rooms.mjs`);
    return { id, name: NAMES[id], floorName: r.newName, oldName: r.oldName, floor: r.floor, sqft: r.sqft || null, bookable: !NOT_BOOKABLE.has(id) };
  }),
};
const names = out.rooms.map((r) => r.name);
if (new Set(names).size !== names.length) throw new Error("room names must be unique");

const json = `${JSON.stringify(out, null, 2)}\n`;
const path = new URL("../rooms.json", import.meta.url);
if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync(path, "utf8"); } catch {}
  if (current !== json) { console.error("rooms.json is out of date: run node scripts/rooms.mjs"); process.exit(1); }
  console.log(`rooms.json OK (${out.rooms.length} rooms)`);
} else {
  writeFileSync(path, json);
  console.log(`wrote rooms.json (${out.rooms.length} rooms, ${out.rooms.filter((r) => r.bookable).length} bookable)`);
}
