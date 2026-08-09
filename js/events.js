document.addEventListener("DOMContentLoaded", async () => {
  const upcomingMount = document.getElementById("upcoming-event");
  const roadMount = document.getElementById("road-events");
  const roadEmpty = document.getElementById("road-empty");
  const pastMount = document.getElementById("past-events");
  const pastEmpty = document.getElementById("past-empty");

  const eventsData = await loadEventsData();
  if (!eventsData) return;

  const upcomingFallback = eventsData.upcomingFallback || {
    title: "Team TXC will be back with another tournament soon.",
    subtitle: "Follow our socials for the next announcement and registration link."
  };

  const roadFallback = eventsData.roadFallback || {
    title: "TXC IS LOOKING FOR TOURNAMENTS TO CRASH.",
    subtitle: "Check back later to see where we're heading next."
  };

  const showUpcomingTournament = !!eventsData.showUpcomingTournament;
  const showRoadEvents = eventsData.showRoadEvents !== false;

  let hostedEvents = Array.isArray(eventsData.upcomingHostedEvents)
    ? eventsData.upcomingHostedEvents.slice()
    : [];

  hostedEvents = hostedEvents.sort((a, b) => getTimestamp(a) - getTimestamp(b));

  const roadEvents = Array.isArray(eventsData.roadEvents)
    ? eventsData.roadEvents.slice().sort((a, b) => getTimestamp(a) - getTimestamp(b))
    : [];

  const pastTournaments = Array.isArray(eventsData.pastTournaments)
    ? eventsData.pastTournaments.slice().sort((a, b) => getTimestamp(b) - getTimestamp(a))
    : [];

  const startggConfig = eventsData.startgg || {};
  if (startggConfig.enabled && startggConfig.upcomingEndpoint) {
    const startggEvent = await tryLoadStartggUpcoming(startggConfig.upcomingEndpoint);
    if (startggEvent) {
      hostedEvents.unshift(startggEvent);
      hostedEvents.sort((a, b) => getTimestamp(a) - getTimestamp(b));
    }
  }

  const nextHostedEvent = getNextHostedEvent(hostedEvents);

  renderUpcoming(nextHostedEvent, showUpcomingTournament, upcomingFallback);
  renderRoadEvents(roadEvents, showRoadEvents, roadFallback);
  renderPastEvents(pastTournaments);

  async function loadEventsData() {
    try {
      const response = await fetch("/data/events.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load events.json");
      return await response.json();
    } catch (error) {
      console.error(error);
      if (upcomingMount) {
        upcomingMount.innerHTML = `
          <h2>Events data unavailable</h2>
          <p class="event-meta">Please check /data/events.json and try again.</p>
        `;
      }
      return null;
    }
  }

  function getTimestamp(item) {
    const rawDate = item && (item.dateIso || item.date);
    if (!rawDate) return Number.MAX_SAFE_INTEGER;
    const parsed = Date.parse(rawDate);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  }

  function getNextHostedEvent(events) {
    if (!events.length) return null;
    const now = Date.now();
    const future = events.filter(event => getTimestamp(event) >= now);
    return (future.length ? future : events)[0];
  }

  async function tryLoadStartggUpcoming(endpoint) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) return null;
      const payload = await response.json();
      if (!payload || !payload.name || !payload.date) return null;

      return {
        name: payload.name,
        game: payload.game || "Super Smash Bros. Ultimate",
        date: payload.date,
        dateIso: payload.dateIso || payload.date,
        location: payload.location || "Online",
        registerLabel: payload.registerLabel || "Register",
        registerLink: payload.registerLink || "https://www.supermajor.gg/"
      };
    } catch (error) {
      console.warn("Supermajor endpoint unavailable:", error);
      return null;
    }
  }

  function renderUpcoming(nextHostedEvent, isEnabled, fallback) {
    if (!upcomingMount) return;

    if (isEnabled && nextHostedEvent) {
      upcomingMount.innerHTML = `
        <h2>${nextHostedEvent.name}</h2>
        <p class="event-game">${nextHostedEvent.game}</p>
        <p class="event-meta">${nextHostedEvent.date}</p>
        <p class="event-meta">📍 ${nextHostedEvent.location}</p>
        <a class="btn bubble-btn" href="${nextHostedEvent.registerLink}" target="_blank" rel="noopener noreferrer">
          ${nextHostedEvent.registerLabel} →
        </a>
        <p class="event-support-text"><strong>Can't make this one?</strong><br>${fallback.title}</p>
      `;
      return;
    }

    upcomingMount.innerHTML = `
      <h2>No Active Hosted Tournament</h2>
      <p class="event-support-text"><strong>${fallback.title}</strong></p>
      <p class="event-meta">${fallback.subtitle}</p>
    `;
  }

  function renderRoadEvents(events, isEnabled, fallback) {
    if (!roadMount || !roadEmpty) return;

    if (!isEnabled || !events.length) {
      roadEmpty.hidden = false;
      roadEmpty.innerHTML = `
        <strong>${fallback.title}</strong>
        <p>${fallback.subtitle}</p>
      `;
      return;
    }

    roadMount.innerHTML = events.map(event => `
      <details class="event-dropdown">
        <summary>${event.date} — ${event.name}</summary>
        <div class="event-dropdown-body">
          <p>📍 ${event.location}</p>
          <p>🎮 ${event.game}</p>
          <p>👤 ${event.players}</p>
        </div>
      </details>
    `).join("");
  }

  function renderPastEvents(tournaments) {
    if (!pastMount || !pastEmpty) return;

    if (!tournaments.length) {
      pastEmpty.hidden = false;
      return;
    }

    pastMount.innerHTML = tournaments.map(tournament => {
      const teamResults = Array.isArray(tournament.teamResults) ? tournament.teamResults : [];
      const resultsMarkup = teamResults.length
        ? `<ul class="event-results-list">${tournament.teamResults.map(result => `<li>${result}</li>`).join("")}</ul>`
        : "<p>Team results will be posted soon.</p>";

      return `
        <details class="event-dropdown event-dropdown-past">
          <summary>${tournament.name}</summary>
          <div class="event-dropdown-body">
            <p class="event-meta">${tournament.date}</p>
            <p class="event-meta">${tournament.hostOrLocation}</p>

            <div class="event-more">
              <h3>Team Results</h3>
              ${resultsMarkup}
              <div class="event-links-group">
                <p><a href="${tournament.vodLink}" target="_blank" rel="noopener noreferrer">VOD: ${tournament.vodLabel} →</a></p>
                <p><a href="${tournament.bracketLink}" target="_blank" rel="noopener noreferrer">Bracket: ${tournament.bracketLabel} →</a></p>
              </div>
            </div>
          </div>
        </details>
      `;
    }).join("");
  }
});
