// floorplan.theschool.nyc: the floor plan page (theschool.nyc/floorplan) at its own address.
// The page loads its images from the site root, so every path is fetched from the site Worker
// and "/" is the floor plan itself. rooms.json (the room index) is served the same way.
// SITE is a service binding to the site Worker: a plain fetch of theschool.nyc from a Worker in
// the same zone skips that Worker's route and reaches the zone's origin (an old password page, 401).
const ORIGIN = "https://theschool.nyc";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("method not allowed", { status: 405 });
    const path = url.pathname === "/" || url.pathname === "/index.html" ? "/floorplan" : url.pathname;
    const res = await env.SITE.fetch(`${ORIGIN}${path}${url.search}`, { method: request.method, redirect: "manual" });
    const out = new Response(res.body, res);
    if (path === "/rooms.json") out.headers.set("Access-Control-Allow-Origin", "*");
    return out;
  },
};
