/* people.js — populate People page from students.json
   - No "Year N" labels
   - Icons row, then meta lines (co-advisor + start–end)
   - Alumni grouped into Ph.D. / M.S. / Undergraduate and rendered one-line:
     "Name (Degree): period, Co-advisor: X, First Employment: Y"
*/
(function () {
  function makeIcon(href, label, glyph) {
    if (!href || href === "#") return null;
    const link = label === "Email" && !/^mailto:/i.test(href) ? `mailto:${href}` : href;

    const a = document.createElement("a");
    a.className = "icon-btn";
    a.setAttribute("aria-label", label);
    a.textContent = glyph;
    a.href = link;

    if (/^https?:\/\//i.test(link)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }

  function formatPeriod(start, end) {
    const s = (start || "").trim();
    const e = (end || "").trim();
    if (!s && !e) return "";
    if (s && !e) return `${s} - `;
    if (s && e)  return `${s} - ${e}`;
    return `- ${e}`; // only end provided
  }

  function renderGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = "";

    items.forEach((person) => {
      const card = document.createElement("article");
      card.className = "person-card";

      const img = document.createElement("img");
      img.className = "avatar";
      img.src = person.img || "images/people/placeholder.jpg";
      img.alt = `Portrait of ${person.name}`;
      img.loading = "lazy";
      img.decoding = "async";

      const h3 = document.createElement("h3");
      h3.className = "person-name";
      const nameLink = document.createElement("a");
      nameLink.href = person.website && person.website !== "#" ? person.website : "#";
      nameLink.textContent = person.name;
      h3.appendChild(nameLink);

      // Icons row
      const links = document.createElement("div");
      links.className = "person-links";
      links.setAttribute("aria-label", `Links for ${person.name}`);
      [
        makeIcon(person.email,  "Email",          "✉︎"),
        makeIcon(person.scholar,"Google Scholar", "🎓"),
        makeIcon(person.github, "GitHub",         "🐙"),
        makeIcon(person.website,"Homepage",       "🏠"),
      ].forEach((el) => el && links.appendChild(el));

      // Build in desired order: avatar/name -> icons -> meta lines
      card.append(img, h3, links);

      // Meta lines below icons
      if (person.co_advisor) {
        const p = document.createElement("p");
        p.className = "person-meta";
        p.textContent = `Co-advised with ${person.co_advisor}`;
        card.append(p);
      }

      const period = formatPeriod(person.start, person.end);
      if (period) {
        const p = document.createElement("p");
        p.className = "person-meta";
        p.textContent = period;
        card.append(p);
      }

      grid.appendChild(card);
    });
  }

  // ---- Alumni ----
  function alumniLine(a) {
    const period = formatPeriod(a.start, a.end);
    const bits = [];

    // "Name (Degree): period"
    let head = a.name;
    if (a.degree) head += ` (${a.degree})`;
    head += ":" + (period ? ` ${period}` : "");

    if (a.co_advisor)       bits.push(`Co-advisor: ${a.co_advisor}`);
    if (a.first_employment) bits.push(`First Employment: ${a.first_employment}`);

    return bits.length ? `${head}, ${bits.join(", ")}` : head;
  }

  function renderAlumniList(listId, items) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = "";
    items.forEach((a) => {
      const li = document.createElement("li");
      li.className = "alumni-item";
      li.textContent = alumniLine(a);
      list.appendChild(li);
    });
  }

  function bucketAlumni(items) {
    const groups = { phd: [], ms: [], ug: [] };
    items.forEach((a) => {
      const lvl = (a.level || "").toLowerCase();
      if (lvl === "phd" || lvl === "ph.d." || lvl === "ph.d") groups.phd.push(a);
      else if (lvl === "ms" || lvl === "m.s." || lvl === "m.s" || lvl === "masters") groups.ms.push(a);
      else if (lvl === "ug" || lvl === "undergrad" || lvl === "undergraduate") groups.ug.push(a);
    });
    return groups;
  }

  // ---- Fetch & render ----
  fetch("json/students.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((data) => {
      const phd    = (data && data.phd_students) || [];
      const ms     = (data && data.ms_students) || [];
      const ug     = (data && data.ug_students)  || [];
      const alumni = (data && data.alumni)       || [];

      renderGrid("phd-grid", phd);
      renderGrid("ms-grid",  ms);
      renderGrid("ug-grid",  ug);

      const buckets = bucketAlumni(alumni);
      renderAlumniList("alumni-phd-list", buckets.phd);
      renderAlumniList("alumni-ms-list",  buckets.ms);
      renderAlumniList("alumni-ug-list",  buckets.ug);
    })
    .catch((err) => {
      console.error("People load error:", err);
      ["phd-grid","ms-grid","ug-grid"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<p class="muted">Could not load data. Check <code>students.json</code>.</p>';
      });
      ["alumni-phd-list","alumni-ms-list","alumni-ug-list"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<li class="muted">Could not load alumni. Check <code>students.json</code>.</li>';
      });
    });
})();
