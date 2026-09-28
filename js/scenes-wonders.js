// Cat Utopia — the ?scenes debug page. All 7 wonder scenes (including the
// Great Wall) are now ported pixel-for-pixel from the hand-drawn masters in
// scenes-master-wonders.js.

// Debug page at ?scenes — every wonder in day/golden/night at 4x, for the
// grounding/lighting QA loop.
function renderScenesDebugPage(container) {
  const tods = ["day", "golden", "night"];
  container.innerHTML = `<div class="catsheet"><div class="catsheet-section"><h3>Wonder scenes — day / golden / night, 4x</h3>
    ${WONDERS.map((w) => `<div class="catsheet-row" style="flex-direction:column;align-items:flex-start">
      <span>${esc(w.name)} (${w.key})</span>
      <div style="display:flex;gap:8px">${tods.map((tod) => {
        const scn = renderScene(w.key, tod);
        return `<div><div style="width:${scn.w * 4}px;height:${scn.h * 4}px;background-image:url(${scn.url});background-size:${scn.w * 4}px ${scn.h * 4}px;image-rendering:pixelated"></div><span>${tod}</span></div>`;
      }).join("")}</div>
    </div>`).join("")}
  </div></div>`;
}
