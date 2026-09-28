// d3 orthographic globe, ported/adapted from the original Torn Atlas prototype's drawGlobe().
let GEO = null, UID = 0;
function geoReady() { return typeof d3 !== "undefined" && typeof topojson !== "undefined"; }
function geoData() {
  if (GEO || !geoReady()) return GEO;
  const fc = topojson.feature(TOPO, TOPO.objects.countries);
  const byId = {};
  fc.features.forEach((f) => { byId[f.id] = f; });
  Object.entries(SMALLGEO).forEach(([id, g]) => { byId[id] = { type: "Feature", id, geometry: g }; });
  GEO = { land: fc, byId };
  return GEO;
}

// Creates a globe bound to a country. Returns a controller with
// { markGuess(cc), setZoom(bool), destroy() }.
function createRoundGlobe(svgEl, cc) {
  const W = WORLD[cc];
  const [lat, lng] = W.ll;
  let zoomed = false;
  let wrongCC = null;
  if (!geoReady()) {
    svgEl.innerHTML = `<circle cx="120" cy="120" r="110" class="g-sea"/><text x="120" y="126" text-anchor="middle" class="g-fallback">${lat.toFixed(0)}°, ${lng.toFixed(0)}°</text>`;
    return { markGuess() {}, setZoom() {}, destroy() {} };
  }
  const G = geoData(), svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  const baseScale = 108;
  const zoomScale = Math.max(220, Math.min(900, 260000 / Math.sqrt(Math.max(W.area, 200))));
  const proj = d3.geoOrthographic().scale(baseScale).translate([120, 120]).clipAngle(90).rotate([-lng, -Math.max(-60, Math.min(60, lat))]);
  const path = d3.geoPath(proj), grat = d3.geoGraticule10();
  const defs = svg.append("defs");
  const gid = "gl" + UID++;
  const rg = defs.append("radialGradient").attr("id", gid).attr("cx", "38%").attr("cy", "32%").attr("r", "75%");
  rg.append("stop").attr("offset", "0").attr("class", "g-sea-hi");
  rg.append("stop").attr("offset", "1").attr("class", "g-sea-lo");
  svg.append("circle").attr("cx", 120).attr("cy", 120).attr("r", 108).attr("fill", `url(#${gid})`).attr("class", "g-rim");
  const gGrat = svg.append("path").attr("class", "g-grat");
  const gLand = svg.append("path").attr("class", "g-land");
  const target = G.byId[W.ccn3];
  const gTarget = svg.append("path").attr("class", "g-target");
  const gWrong = svg.append("path").attr("class", "g-wrong");
  const pin = svg.append("g").attr("class", "g-pin");
  pin.append("circle").attr("r", 11).attr("class", "g-ping");
  pin.append("circle").attr("r", 4.2).attr("class", "g-dot");

  function render() {
    gGrat.attr("d", path(grat));
    gLand.attr("d", path(G.land));
    gTarget.attr("d", target ? path(target) : null);
    const wTarget = wrongCC ? G.byId[WORLD[wrongCC].ccn3] : null;
    gWrong.attr("d", wTarget ? path(wTarget) : null);
    const p = proj([lng, lat]);
    const vis = !target && d3.geoDistance([lng, lat], [-proj.rotate()[0], -proj.rotate()[1]]) < Math.PI / 2;
    pin.attr("transform", p ? `translate(${p[0]},${p[1]})` : null).attr("opacity", vis ? 1 : 0);
  }
  proj.scale(baseScale);
  render();
  svg.transition().duration(1);

  function setZoom(z) {
    zoomed = z;
    const s = zoomed ? zoomScale : baseScale;
    const i = d3.interpolateNumber(proj.scale(), s);
    const t = d3.timer((e) => {
      const k = Math.min(1, e / 500);
      proj.scale(i(d3.easeCubicInOut(k)));
      render();
      if (k >= 1) t.stop();
    });
  }
  function markGuess(guessCC) { wrongCC = guessCC; render(); }
  function destroy() {}
  return { markGuess, setZoom, destroy };
}

// Small static globe used inside the dossier ("country" tab) — shows the
// country's location, no interactivity.
function globeHTML(cc, opts = {}) {
  const label = opts.hideName ? "Where the country is on the globe" : `Where ${esc(WORLD[cc].n)} is on the globe`;
  return `<div class="globe ${opts.cls || ""}" data-globe="${cc}"><svg viewBox="0 0 240 240" role="img" aria-label="${label}"></svg></div>`;
}
function drawGlobes(root = document) {
  root.querySelectorAll("[data-globe]").forEach((el) => {
    if (el._drawn) return;
    el._drawn = true;
    createRoundGlobe(el.querySelector("svg"), el.dataset.globe);
  });
}
