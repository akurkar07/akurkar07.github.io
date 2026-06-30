(() => {
  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    const label = document.getElementById("theme-label");
    if (label) {
      label.textContent = theme === "dark" ? "light mode" : "dark mode";
    }
  }

  function drawTimelineBackgrounds() {
    document.querySelectorAll(".timeline-bg").forEach((canvas, index) => {
      drawChip(canvas, index * 17 + 1);
    });
  }

  function toggleTheme() {
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
    drawHero();
    drawTimelineBackgrounds();
  }

  function themeColors() {
    const styles = getComputedStyle(document.body);
    return {
      bg: styles.getPropertyValue("--bg-color").trim() || "#0d0b14",
      bgVar: styles.getPropertyValue("--bg-variant").trim() || "#1a1525",
      primary: styles.getPropertyValue("--primary").trim() || "#a78bfa",
      secondary: styles.getPropertyValue("--secondary").trim() || "#8a3ffc",
    };
  }

  function showSteamPuff(x, y) {
    const puff = document.createElement("img");
    const driftX = Math.round((Math.random() - 0.5) * 48);
    const rise = Math.round(24 + Math.random() * 28);
    const rotation = Math.round((Math.random() - 0.5) * 18);

    puff.src = "image.png";
    puff.alt = "";
    puff.className = "steam-puff";
    puff.setAttribute("aria-hidden", "true");
    puff.style.setProperty("--steam-x", `${x}px`);
    puff.style.setProperty("--steam-y", `${y}px`);
    puff.style.setProperty("--steam-drift-x", `${driftX}px`);
    puff.style.setProperty("--steam-rise", `${rise}px`);
    puff.style.setProperty("--steam-rotate", `${rotation}deg`);

    document.body.appendChild(puff);
    puff.addEventListener("animationend", () => puff.remove(), { once: true });
  }

  function showSteamBurst(mode) {
    const poolSize = mode === "rain" ? 220 : 70;
    const burstPool = [];

    for (let index = 0; index < poolSize; index += 1) {
      const drop = document.createElement("img");

      drop.src = "image.png";
      drop.alt = "";
      drop.className = "steam-burst-drop";
      drop.setAttribute("aria-hidden", "true");
      document.body.appendChild(drop);
      burstPool.push(drop);
    }

    const spawnDrop = (drop) => {
      const size = Math.round(34 + Math.random() * 42);
      const driftX = Math.round((Math.random() - 0.5) * 120);
      const rotation = Math.round((Math.random() - 0.5) * 80);
      const spin = Math.round(220 + Math.random() * 520) * (Math.random() < 0.5 ? -1 : 1);
      const duration = mode === "rain" ? (0.82 + Math.random() * 0.48).toFixed(2) : (1.25 + Math.random() * 0.55).toFixed(2);

      drop.classList.remove("is-raining", "is-confetti");
      drop.style.setProperty("--burst-drift-x", `${driftX}px`);
      drop.style.setProperty("--burst-rotate", `${rotation}deg`);
      drop.style.setProperty("--burst-spin", `${spin}deg`);
      drop.style.setProperty("--burst-size", `${size}px`);
      drop.style.setProperty("--burst-duration", `${duration}s`);

      if (mode === "rain") {
        drop.style.setProperty("--burst-x", `${Math.round(Math.random() * 100)}vw`);
        drop.classList.add("is-raining");
        return;
      }

      const fromLeft = Math.random() < 0.5;
      const travelX = Math.round((window.innerWidth * (0.45 + Math.random() * 0.28)) * (fromLeft ? 1 : -1));
      const travelY = Math.round((Math.random() - 0.34) * window.innerHeight * 0.32);

      drop.style.setProperty("--burst-x", fromLeft ? "-70px" : "calc(100vw + 70px)");
      drop.style.setProperty("--burst-y", `${Math.round(18 + Math.random() * 64)}vh`);
      drop.style.setProperty("--burst-travel-x", `${travelX}px`);
      drop.style.setProperty("--burst-travel-y", `${travelY}px`);
      drop.classList.add("is-confetti");
    };

    burstPool.forEach((drop) => {
      window.setTimeout(() => spawnDrop(drop), mode === "rain" ? Math.random() * 1000 : Math.random() * 140);
    });

    window.setTimeout(() => {
      burstPool.forEach((drop) => drop.remove());
    }, 2500);
  }

  function bindSteamTrigger() {
    const trigger = document.querySelector(".steam-trigger");
    if (!trigger) {
      return;
    }

    const maxCharge = 10;
    let charge = 0;
    let nextBurstMode = "rain";

    function updateCharge() {
      trigger.style.setProperty("--steam-progress", `${(charge / maxCharge) * 100}%`);
      trigger.dataset.steamStarted = String(charge > 0);
      trigger.dataset.steamCharged = String(charge >= maxCharge);
      trigger.setAttribute(
        "aria-label",
        charge >= maxCharge
          ? "Activate charged easter egg rain"
          : `Activate easter egg, charge ${charge} of ${maxCharge}`
      );
    }

    function activate(x, y) {
      if (charge >= maxCharge) {
        showSteamBurst(nextBurstMode);
        nextBurstMode = nextBurstMode === "rain" ? "confetti" : "rain";
        charge = 0;
        updateCharge();
        return;
      }

      showSteamPuff(x, y);
      charge += 1;
      updateCharge();
    }

    updateCharge();

    trigger.addEventListener("click", (event) => {
      activate(event.clientX, event.clientY);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      const rect = trigger.getBoundingClientRect();
      activate(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  const architectureStyles = [
    {
      id: "coptic",
      label: "Coptic",
      era: "3rd century onward",
      title: "Coptic architecture",
      building: "Hanging Church, Cairo",
      image: "./assets/img/architecture/coptic-hanging-church.jpg",
      source: "https://commons.wikimedia.org/wiki/File:Cairo,_Old_Cairo,_Hanging_Church,_Egypt,_Oct_2004_edit.jpg",
      description:
        "Coptic architecture grows out of early Christian Egypt, where basilican planning, monastic enclosure, thick masonry, timber screens, icons, and desert climate all shape the building language. It often feels inward and protective rather than outwardly monumental: courtyards, chapels, screens, and layered thresholds build up a sequence of worship and retreat. The page treatment uses warm plaster, dark timber, narrow divisions, and quiet icon-like framing to suggest that mixture of refuge, liturgy, and material age.",
      note: "Placed first in the chronology as an early Christian architectural tradition that predates the later medieval and Renaissance references.",
      details: ["basilican plan", "monastic enclosure", "timber screens", "desert masonry"],
      images: [
        {
          src: "./assets/img/architecture/coptic-hanging-church.jpg",
          building: "Hanging Church, Cairo",
          source: "https://commons.wikimedia.org/wiki/File:Cairo,_Old_Cairo,_Hanging_Church,_Egypt,_Oct_2004_edit.jpg",
        },
        {
          src: "./assets/img/architecture/coptic-desert-monastery.jpg",
          building: "Church of Saint Mark, Monastery of Saint Anthony",
          source:
            "https://commons.wikimedia.org/wiki/File:Monastery_of_Saint_Anthony,_Egypt_-_Church_of_Saint_Mark,_exterior_view_-_MSBZ004_A24_-_Dumbarton_Oaks.jpg",
        },
        {
          src: "./assets/img/architecture/coptic-icon.jpg",
          building: "Coptic icon of Anthony the Great",
          source:
            "https://commons.wikimedia.org/wiki/File:Anthony_the_Great_(coptic_icon,_19-20_c.,_priv._coll).jpg",
          fit: "contain",
        },
      ],
    },
    {
      id: "islamic-seville",
      label: "Islamic Seville",
      era: "1184-1198",
      title: "Islamic architecture in Seville",
      building: "La Giralda, Seville",
      image: "./assets/img/architecture/islamic-seville.jpg",
      source: "https://commons.wikimedia.org/wiki/File:Sevilla_Cathedral_-_Giralda.jpg",
      description:
        "The Seville reference begins with Almohad architecture, where surface, structure, and climate work together rather than competing for attention. Brick massing gives the tower its gravity, while repeated geometric ornament breaks the surface into rhythm and shadow. The aesthetic here uses warm masonry tones, restrained patterning, and a sense of vertical composure, taking cues from the Giralda without reducing Islamic architecture to decorative tiling alone.",
      note: "Introduced here through Seville's late-12th-century mosque minaret, later adapted as the cathedral bell tower.",
      details: ["courtyard logic", "geometric repetition", "brick massing", "filtered shade"],
      images: [
        {
          src: "./assets/img/architecture/islamic-seville.jpg",
          building: "La Giralda, Seville",
          source: "https://commons.wikimedia.org/wiki/File:Sevilla_Cathedral_-_Giralda.jpg",
        },
        {
          src: "./assets/img/architecture/islamic-seville-alcazar.jpg",
          building: "Patio de las Doncellas, Real Alcazar of Seville",
          source: "https://commons.wikimedia.org/wiki/File:Patio_de_las_Doncellas,_Real_Alcázar_de_Sevilla.jpg",
        },
        {
          src: "./assets/img/architecture/islamic-seville-torre-oro.jpg",
          building: "Torre del Oro, Seville",
          source: "https://commons.wikimedia.org/wiki/File:Canal_de_Alfonso_XIII_Torre_del_Oro_Sevilla.jpg",
        },
      ],
    },
    {
      id: "renaissance",
      label: "Renaissance",
      era: "c. 1502",
      title: "Renaissance",
      building: "Tempietto del Bramante, Rome",
      image: "./assets/img/architecture/renaissance.jpg",
      source: "https://commons.wikimedia.org/wiki/File:02_Bramante_Tempietto_Exterior.jpg",
      description:
        "Renaissance architecture is treated as an argument for proportion and legibility. The Tempietto is small, but it feels complete because each part has a measured relationship to the whole: column, drum, dome, and stair all belong to the same geometric order. The page treatment uses calm spacing, clear axes, and stone-paper colour rather than theatrical ornament, aiming for a composed surface that feels drawn from humanist planning and classical revival.",
      note: "The Tempietto is a compact reference for High Renaissance balance and antique revival.",
      details: ["central axis", "classical order", "mathematical spacing", "quiet symmetry"],
      images: [
        {
          src: "./assets/img/architecture/renaissance.jpg",
          building: "Tempietto del Bramante, Rome",
          source: "https://commons.wikimedia.org/wiki/File:02_Bramante_Tempietto_Exterior.jpg",
        },
        {
          src: "./assets/img/architecture/renaissance-villa-rotonda.jpg",
          building: "Villa La Rotonda, Vicenza",
          source: "https://commons.wikimedia.org/wiki/File:Villa_%22La_Rotonda%22_di_Andrea_Palladio.JPG",
        },
        {
          src: "./assets/img/architecture/renaissance-palazzo-farnese.jpg",
          building: "Palazzo Farnese, Rome",
          source: "https://commons.wikimedia.org/wiki/File:Palazzo_Farnese_Fassade.jpg",
        },
      ],
    },
    {
      id: "baroque",
      label: "Baroque",
      era: "1638 onward",
      title: "Baroque",
      building: "San Carlo alle Quattro Fontane, Rome",
      image: "./assets/img/architecture/baroque.jpg",
      source: "https://commons.wikimedia.org/wiki/File:Rome_S._Carlo_alle_Quattro_Fontane_facade.jpg",
      description:
        "Baroque architecture keeps the classical vocabulary but sets it in motion. Borromini's San Carlo alle Quattro Fontane turns facade into pressure and release, using curves, deep shadow, and compressed space to make stone feel almost elastic. The visual treatment therefore leans into contrast, layered borders, and directional light, but keeps the palette disciplined so the result suggests theatrical depth rather than becoming a caricature of luxury.",
      note: "Borromini's church is used for its restless concave-convex facade and spatial tension.",
      details: ["compressed depth", "curved pressure", "shadow theatre", "layered ornament"],
      images: [
        {
          src: "./assets/img/architecture/baroque.jpg",
          building: "San Carlo alle Quattro Fontane, Rome",
          source: "https://commons.wikimedia.org/wiki/File:Rome_S._Carlo_alle_Quattro_Fontane_facade.jpg",
        },
        {
          src: "./assets/img/architecture/baroque-versailles.jpg",
          building: "Palace of Versailles, garden facade",
          source: "https://commons.wikimedia.org/wiki/File:Garden_facade_of_the_Palace_of_Versailles,_April_2011.jpg",
        },
        {
          src: "./assets/img/architecture/baroque-st-peters.jpg",
          building: "St Peter's Basilica, Rome",
          source: "https://commons.wikimedia.org/wiki/File:Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg",
        },
      ],
    },
    {
      id: "neoclassical",
      label: "Neoclassical",
      era: "1758 onward",
      title: "Neoclassical",
      building: "Panthéon, Paris",
      image: "./assets/img/architecture/neoclassical.jpg",
      source: "https://commons.wikimedia.org/wiki/File:F6362_Paris_5e_Pantheon_facade_rwk.jpg",
      description:
        "Neoclassicism returns to antiquity through a more civic and rational lens. The Panthéon uses the temple front, dome, and disciplined stone facade to project order, public seriousness, and Enlightenment confidence. Here the interface cools into pale stone, measured columns, and crisp division lines, favouring clarity and restraint over expressive movement. It should feel institutional, balanced, and slightly austere.",
      note: "The Panthéon anchors this style through its Enlightenment-era classical revival.",
      details: ["temple front", "civic restraint", "pale stone", "regular bays"],
      images: [
        {
          src: "./assets/img/architecture/neoclassical.jpg",
          building: "Pantheon, Paris",
          source: "https://commons.wikimedia.org/wiki/File:F6362_Paris_5e_Pantheon_facade_rwk.jpg",
        },
        {
          src: "./assets/img/architecture/neoclassical-british-museum.jpg",
          building: "British Museum, London",
          source: "https://commons.wikimedia.org/wiki/File:British_Museum_London_2016_Facade_01.JPG",
        },
        {
          src: "./assets/img/architecture/neoclassical-brandenburg-gate.jpg",
          building: "Brandenburg Gate, Berlin",
          source: "https://commons.wikimedia.org/wiki/File:Brandenburg_Gate_-_Brandenburger_Tor_-_Berlin_-_Germany_-_01.jpg",
        },
      ],
    },
    {
      id: "romantic",
      label: "Romantic",
      era: "early 19th century",
      title: "Romantic / Gothic Revival",
      building: "Palace of Westminster, London",
      image: "./assets/img/architecture/romantic.jpg",
      source: "https://commons.wikimedia.org/wiki/File:Palace.of.westminster.arp.jpg",
      description:
        "Romantic architecture is less a single formal system than a mood: historical memory, landscape, drama, and national imagination. Using the Gothic Revival Palace of Westminster as a reference, this treatment favours vertical rhythm, pointed framing, shadowed atmosphere, and a slightly weathered palette. The aim is not fantasy-gothic exaggeration, but the nineteenth-century taste for emotional association, silhouette, and architecture as a vessel for memory.",
      note: "The Palace of Westminster stands in for the Romantic-era return to Gothic language.",
      details: ["vertical silhouette", "historic memory", "picturesque asymmetry", "weathered atmosphere"],
      images: [
        {
          src: "./assets/img/architecture/romantic.jpg",
          building: "Palace of Westminster, London",
          source: "https://commons.wikimedia.org/wiki/File:Palace.of.westminster.arp.jpg",
        },
        {
          src: "./assets/img/architecture/romantic-neuschwanstein.jpg",
          building: "Neuschwanstein Castle, Bavaria",
          source: "https://commons.wikimedia.org/wiki/File:Exterior_of_Neuschwanstein_Castle_01.jpg",
        },
        {
          src: "./assets/img/architecture/romantic-strawberry-hill.jpg",
          building: "Strawberry Hill House, Twickenham",
          source: "https://commons.wikimedia.org/wiki/File:Exterior_of_Strawberry_Hill_House_01.jpg",
        },
      ],
    },
    {
      id: "brutalism",
      label: "Brutalism",
      era: "1952",
      title: "Brutalism",
      building: "Unité d'Habitation, Marseille",
      image: "./assets/img/architecture/brutalism.jpg",
      source: "https://en.wikivoyage.org/wiki/File:Unite_d%27Habitation,_Marseille.jpg",
      description:
        "Brutalism is handled through mass, repetition, and constructional honesty. The Unité d'Habitation reference brings concrete, modular units, exposed structure, and a social-housing scale that is both severe and humane. The page becomes heavier and plainer here: strong edges, visible grid, muted concrete colour, and little decorative softness. The goal is to communicate weight and system, not to turn Brutalism into generic grey minimalism.",
      note: "Le Corbusier's housing block is used as the mid-century reference point.",
      details: ["raw concrete", "modular cells", "structural legibility", "social scale"],
      images: [
        {
          src: "./assets/img/architecture/brutalism.jpg",
          building: "Unite d'Habitation, Marseille",
          source: "https://en.wikivoyage.org/wiki/File:Unite_d%27Habitation,_Marseille.jpg",
        },
        {
          src: "./assets/img/architecture/brutalism-boston-city-hall.jpg",
          building: "Boston City Hall",
          source: "https://commons.wikimedia.org/wiki/File:Boston_City_Hall,_with_Faneuil_Hall_(8615888189).jpg",
        },
        {
          src: "./assets/img/architecture/brutalism-barbican.jpg",
          building: "Barbican Estate, London",
          source: "https://commons.wikimedia.org/wiki/File:Barbican_Estate_Frobisher_Crescent_City_of_London_2026_06.jpg",
        },
      ],
    },
    {
      id: "ecobrutalism",
      label: "Ecobrutalism",
      era: "2014",
      title: "Ecobrutalism",
      building: "Bosco Verticale, Milan",
      image: "./assets/img/architecture/ecobrutalism.jpg",
      source: "https://unsplash.com/photos/low-angle-photography-of-buildings-with-plants-on-it-Y7ufx8R8PM0",
      description:
        "Ecobrutalism keeps the hard frame of late-modern concrete architecture but allows planting, weather, and ecological systems to become part of the composition. Bosco Verticale is not Brutalist in the strict historical sense, but it is useful here as a contemporary reference for structure and vegetation interlocking at urban scale. The page keeps the grid and mass, then softens it with layered greens, quieter contrast, and organic patterning.",
      note: "Bosco Verticale is a contemporary reference for dense urban greenery grafted onto high-rise structure.",
      details: ["living facade", "green shade", "concrete frame", "biodiversity layer"],
      images: [
        {
          src: "./assets/img/architecture/ecobrutalism.jpg",
          building: "Bosco Verticale, Milan",
          source: "https://unsplash.com/photos/low-angle-photography-of-buildings-with-plants-on-it-Y7ufx8R8PM0",
        },
        {
          src: "./assets/img/architecture/ecobrutalism-bosco-detail.jpg",
          building: "Bosco Verticale detail, Milan",
          source: "https://unsplash.com/photos/a-very-tall-building-with-lots-of-plants-growing-on-it-mcd_HrUrJHw",
        },
        {
          src: "./assets/img/architecture/ecobrutalism-oasia.jpg",
          building: "Oasia Hotel Downtown, Singapore",
          source: "https://commons.wikimedia.org/wiki/File:Oasia_Hotel_Downtown,_Singapore.jpg",
        },
      ],
    },
  ];

  function initArchitectureSampler() {
    const sampler = document.getElementById("architecture-sampler");
    if (!sampler) {
      return;
    }

    const controls = sampler.querySelector(".architecture-controls");
    const image = document.getElementById("architecture-image");
    const building = document.getElementById("architecture-building");
    const source = document.getElementById("architecture-source");
    const era = document.getElementById("architecture-era");
    const title = document.getElementById("architecture-title");
    const description = document.getElementById("architecture-description");
    const note = document.getElementById("architecture-note");
    const details = document.getElementById("architecture-details");
    const previousImage = document.getElementById("architecture-prev");
    const nextImage = document.getElementById("architecture-next");
    const imageCount = document.getElementById("architecture-image-count");
    let activeStyle = architectureStyles[0];
    let activeImageIndex = 0;

    function renderImage() {
      const imageSet = activeStyle.images || [
        { src: activeStyle.image, building: activeStyle.building, source: activeStyle.source },
      ];
      const activeImage = imageSet[activeImageIndex];
      image.removeAttribute("data-load-error");
      image.dataset.fit = activeImage.fit || "cover";
      image.src = `${activeImage.src}?v=3`;
      image.alt = activeImage.building;
      building.textContent = activeImage.building;
      source.href = activeImage.source;
      imageCount.textContent = `${activeImageIndex + 1}/${imageSet.length}`;
      previousImage.disabled = imageSet.length < 2;
      nextImage.disabled = imageSet.length < 2;
    }

    function renderStyle(style) {
      activeStyle = style;
      activeImageIndex = 0;
      sampler.dataset.style = style.id;
      document.body.dataset.style = style.id;
      renderImage();
      era.textContent = style.era;
      title.textContent = style.title;
      description.textContent = style.description;
      note.textContent = style.note;
      details.replaceChildren(
        ...style.details.map((detail) => {
          const item = document.createElement("li");
          item.textContent = detail;
          return item;
        })
      );

      controls.querySelectorAll(".architecture-tab").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.style === style.id));
      });
    }

    previousImage.addEventListener("click", () => {
      const imageSet = activeStyle.images || [];
      activeImageIndex = (activeImageIndex - 1 + imageSet.length) % imageSet.length;
      renderImage();
    });

    nextImage.addEventListener("click", () => {
      const imageSet = activeStyle.images || [];
      activeImageIndex = (activeImageIndex + 1) % imageSet.length;
      renderImage();
    });

    architectureStyles.forEach((style) => {
      const button = document.createElement("button");
      button.className = "architecture-tab";
      button.dataset.style = style.id;
      button.type = "button";
      button.textContent = style.label;
      button.addEventListener("click", () => renderStyle(style));
      controls.appendChild(button);
    });

    image.addEventListener("error", () => {
      image.dataset.loadError = "true";
      building.textContent = `${building.textContent} (image failed to load)`;
    });

    renderStyle(architectureStyles[0]);
  }

  const planetMovements = {
    mars: {
      movement: "CHANNEL 001",
      title: "Runtime Moon",
      description:
        "Lexer, parser, AST, bytecode VM, stack. The machinery rendered as a quiet ASCII body.",
      detail:
        "Pascal interpreter and custom bytecode VM rendered as a text object: source becomes structure, structure becomes execution.",
      link: "interpreter.html",
      linkText: "Open interpreter",
      coda: "ASCII BODY LOCKED. TEXT TRACE LIVE.",
      color: "#dbe7f3",
      color2: "#6aa6ff",
      orbit: 0.48,
      radius: 20,
      speed: 0.00018,
    },
    venus: {
      movement: "CHANNEL 002",
      title: "Routing Grid",
      description: "Readable structure. Every route named, every branch accounted for.",
      detail:
        "About page, CV material, and the plain-language thread connecting language tools, maths, ML, and systems.",
      link: "about.html",
      linkText: "Read about me",
      coda: "TRACE ROUTES. LABEL NODES.",
      color: "#dbe7f3",
      color2: "#9fb7ce",
      orbit: 0.34,
      radius: 18,
      speed: 0.00023,
    },
    mercury: {
      movement: "CHANNEL 003",
      title: "Runtime Loader",
      description: "A static page loads Python and returns output through a controlled browser surface.",
      detail:
        "The interpreter demo runs Python in a static site through Pyodide, then sends source through the real pipeline.",
      link: "interpreter.html",
      linkText: "Try the live demo",
      coda: "MOUNT PYODIDE. IGNITE SOURCE. RETURN TELEMETRY.",
      color: "#dbe7f3",
      color2: "#6aa6ff",
      orbit: 0.25,
      radius: 12,
      speed: 0.00038,
    },
    jupiter: {
      movement: "CHANNEL 004",
      title: "Mission Wall",
      description: "Fast-build records from planning tools, procurement agents, payments, and story systems.",
      detail:
        "HackLondon, START Hack, BSA EPFL, DurHack, HackNotts, and contest work sit here as the collaborative orbit.",
      link: "./",
      linkText: "See the timeline",
      coda: "STACK THE FEEDS. SHIP BEFORE THE SIGNAL FADES.",
      color: "#dbe7f3",
      color2: "#b6c2cf",
      orbit: 0.6,
      radius: 32,
      speed: 0.0001,
    },
    saturn: {
      movement: "CHANNEL 005",
      title: "Core Scan",
      description: "Mathematics, testing, architecture, and the bottom-up route through a system.",
      detail:
        "The common thread is understanding systems from first principles, then earning each abstraction honestly.",
      link: "about.html",
      linkText: "Open about",
      coda: "DESCEND THROUGH THE LAYERS. DO NOT SKIP THE UNDERLYING FORMAT.",
      color: "#d8e0ea",
      color2: "#6aa6ff",
      orbit: 0.72,
      radius: 30,
      speed: 0.000075,
      rings: true,
    },
    uranus: {
      movement: "CHANNEL 006",
      title: "Experiment Log",
      description: "Small builds, prototypes, and code experiments that sit around the main portfolio work.",
      detail:
        "Side projects and prototypes live around the core interpreter, ML, systems, and hackathon work.",
      link: "https://github.com/akurkar07",
      linkText: "Open GitHub",
      coda: "PATCH IDEA. COMMIT TRACE. KEEP THE USEFUL PARTS.",
      color: "#dbe7f3",
      color2: "#9fb7ce",
      orbit: 0.82,
      radius: 23,
      speed: 0.00006,
    },
    neptune: {
      movement: "CHANNEL 007",
      title: "The Far Void",
      description: "Compiler, runtime, applied ML, and tool ideas waiting beyond the visible map.",
      detail:
        "Future work points toward compilers, runtimes, applied ML systems, and better tools for thinking with code.",
      link: "mailto:akurkar07@gmail.com",
      linkText: "Start a conversation",
      coda: "HOLD UNKNOWN_WORK. LISTEN FOR RETURNING SIGNAL.",
      color: "#dbe7f3",
      color2: "#6aa6ff",
      orbit: 0.92,
      radius: 24,
      speed: 0.000045,
    },
  };

  function initPlanetsHome() {
    const canvas = document.getElementById("planets-canvas");
    const controls = document.getElementById("planets-controls");
    if (!canvas || !controls) {
      return;
    }

    const movement = document.getElementById("planet-movement");
    const title = document.getElementById("planet-title");
    const description = document.getElementById("planet-description");
    const detail = document.getElementById("planet-detail");
    const link = document.getElementById("planet-link");
    const coda = document.getElementById("planet-coda");
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: 90 }, (_, index) => {
      const random = prng(index * 97 + 42);
      return {
        x: random(),
        y: random(),
        size: 0.5 + random() * 1.7,
        alpha: 0.18 + random() * 0.62,
      };
    });
    let activeKey = "mars";
    let width = 0;
    let height = 0;
    let animationFrame = null;
    let shouldAnimate = true;
    let pointerX = 0.52;
    let pointerY = 0.46;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth || window.innerWidth;
      height = canvas.offsetHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function setActive(key) {
      const planet = planetMovements[key];
      if (!planet) {
        return;
      }

      activeKey = key;
      document.body.dataset.planet = key;
      document.body.style.setProperty("--soul-x", `${Math.round(pointerX * 100)}%`);
      document.body.style.setProperty("--soul-y", `${Math.round(pointerY * 100)}%`);
      movement.textContent = planet.movement;
      title.textContent = planet.title;
      description.textContent = planet.description;
      detail.textContent = planet.detail;
      link.href = planet.link;
      link.textContent = planet.linkText;
      if (coda) {
        coda.textContent = planet.coda;
      }

      controls.querySelectorAll(".planet-tab").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.planet === key));
      });
    }

    function drawPlanet(planet, key, cx, cy, scale, time) {
      const index = Object.keys(planetMovements).indexOf(key);
      const active = key === activeKey;
      const panelWidth = Math.min(170 * scale, width * 0.2);
      const panelHeight = 86 * scale;
      const columns = 4;
      const x = width * 0.12 + (index % columns) * (panelWidth + 18 * scale);
      const y = height * 0.62 + Math.floor(index / columns) * (panelHeight + 18 * scale);
      const random = prng(index * 811 + 19);

      ctx.strokeStyle = active ? planet.color : "rgba(248, 251, 255, 0.18)";
      ctx.fillStyle = active ? "rgba(5, 11, 15, 0.9)" : "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = active ? 1.8 : 1;
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.strokeRect(x, y, panelWidth, panelHeight);

      ctx.font = `${9 * scale}px "Red Hat Mono", monospace`;
      ctx.fillStyle = active ? planet.color2 : "rgba(248, 251, 255, 0.55)";
      ctx.fillText(planet.movement, x + 8 * scale, y + 15 * scale);

      ctx.fillStyle = active ? planet.color : "rgba(248, 251, 255, 0.38)";
      for (let dot = 0; dot < 58; dot += 1) {
        const px = x + 9 * scale + random() * (panelWidth - 18 * scale);
        const py = y + 25 * scale + random() * (panelHeight - 33 * scale);
        const size = active ? 1.45 * scale : 1 * scale;
        ctx.fillRect(px, py, size, size);
      }

      if (active) {
        ctx.strokeStyle = planet.color2;
        ctx.beginPath();
        ctx.moveTo(x + panelWidth * 0.15, y + panelHeight * 0.72);
        for (let point = 1; point < 8; point += 1) {
          ctx.lineTo(
            x + panelWidth * (0.15 + point * 0.1),
            y + panelHeight * (0.72 - Math.sin(point + time * 0.004) * 0.22)
          );
        }
        ctx.stroke();
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--planet-bg").trim() || "#020304";
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        ctx.globalAlpha = star.alpha * 0.72;
        ctx.fillStyle = "#f8fbff";
        ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
      });
      ctx.globalAlpha = 1;

      const cx = width * 0.5;
      const cy = height * 0.38;
      const scale = Math.max(0.72, Math.min(width, height) / 900);
      const activePlanet = planetMovements[activeKey];
      const radius = Math.min(width, height) * 0.22;
      const chars = "AKURKAR07/01.-_";

      ctx.strokeStyle = `${activePlanet.color}44`;
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 2; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy + ring * 4 * scale,
          radius * (1.18 + ring * 0.14),
          radius * (0.32 + ring * 0.035),
          -0.22 + ring * 0.08,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(219, 231, 243, 0.16)";
      ctx.beginPath();
      ctx.moveTo(width * 0.08, height * 0.9);
      ctx.lineTo(width * 0.92, height * 0.9);
      ctx.stroke();
      for (let tick = 0; tick < 18; tick += 1) {
        const x = width * (0.08 + tick * 0.049);
        ctx.beginPath();
        ctx.moveTo(x, height * 0.9);
        ctx.lineTo(x, height * (tick % 3 === 0 ? 0.875 : 0.888));
        ctx.stroke();
      }

      ctx.save();
      ctx.strokeStyle = activePlanet.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.clip();

      ctx.font = `${Math.max(8, 10 * scale)}px "Red Hat Mono", monospace`;
      ctx.textBaseline = "middle";
      const stepX = 8 * scale;
      const stepY = 12 * scale;
      for (let y = cy - radius; y < cy + radius; y += stepY) {
        for (let x = cx - radius; x < cx + radius; x += stepX) {
          const dx = (x - cx) / radius;
          const dy = (y - cy) / radius;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            continue;
          }
          const wave = Math.sin(dx * 10 + time * 0.0018) + Math.cos(dy * 8 - time * 0.0011);
          const charIndex = Math.abs(Math.floor((wave + dist * 5 + dx * 2) * 3)) % chars.length;
          ctx.fillStyle =
            wave > 0.85
              ? activePlanet.color2
              : wave < -0.5
                ? activePlanet.color
                : "rgba(248, 251, 255, 0.82)";
          ctx.fillText(chars[charIndex], x, y);
        }
      }
      ctx.restore();

      const plumeTop = cy + radius * 0.45;
      const plumeBase = height * 0.96;
      const plumeGradient = ctx.createLinearGradient(cx, plumeTop, cx, plumeBase);
      plumeGradient.addColorStop(0, "rgba(248, 251, 255, 0.95)");
      plumeGradient.addColorStop(0.3, `${activePlanet.color2}44`);
      plumeGradient.addColorStop(1, `${activePlanet.color}00`);
      ctx.fillStyle = plumeGradient;
      ctx.beginPath();
      ctx.moveTo(cx - 5 * scale, plumeTop);
      ctx.quadraticCurveTo(cx - radius * 0.5, height * 0.68, cx - radius * 0.75, plumeBase);
      ctx.quadraticCurveTo(cx, height * 0.82, cx + radius * 0.75, plumeBase);
      ctx.quadraticCurveTo(cx + radius * 0.36, height * 0.68, cx + 5 * scale, plumeTop);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `${activePlanet.color}44`;
      ctx.lineWidth = 1;
      ctx.setLineDash([7 * scale, 10 * scale]);
      for (let line = 0; line < 12; line += 1) {
        const x = width * (0.1 + line * 0.075);
        ctx.beginPath();
        ctx.moveTo(x, height * 0.08);
        ctx.lineTo(x + Math.sin(time * 0.0008 + line) * 18 * scale, height * 0.58);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      Object.entries(planetMovements).forEach(([key, planet]) => {
        drawPlanet(planet, key, cx, cy, scale, time);
      });

      if (shouldAnimate) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    }

    controls.addEventListener("click", (event) => {
      const button = event.target.closest(".planet-tab");
      if (button) {
        setActive(button.dataset.planet);
      }
    });

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth);
      pointerY = event.clientY / Math.max(1, window.innerHeight);
      document.body.style.setProperty("--soul-x", `${Math.round(pointerX * 100)}%`);
      document.body.style.setProperty("--soul-y", `${Math.round(pointerY * 100)}%`);
    });

    resize();
    setActive(activeKey);
    window.addEventListener("resize", resize);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shouldAnimate = false;
      draw(2400);
      return;
    }

    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("pagehide", () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    });
  }

  function prng(seed) {
    return function random() {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 0xffffffff;
    };
  }

  function drawChip(canvas, seed) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth || canvas.parentElement.offsetWidth || 200;
    const height = canvas.offsetHeight || canvas.parentElement.offsetHeight || 80;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const random = prng(seed ^ 0xdead);
    const colors = themeColors();

    ctx.fillStyle = colors.bgVar;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = colors.bgVar;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.secondary;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(2.5, 2.5, width - 5, height - 5);
    ctx.strokeRect(4.5, 4.5, width - 9, height - 9);
    ctx.globalAlpha = 1;

    const minSize = Math.max(12, Math.min(width, height) * 0.18);
    const blocks = [];

    function split(x, y, blockWidth, blockHeight, depth) {
      if (depth <= 0 || blockWidth < minSize * 2 || blockHeight < minSize * 2) {
        if (blockWidth >= minSize && blockHeight >= minSize) {
          blocks.push({ x, y, w: blockWidth, h: blockHeight });
        }
        return;
      }

      if (random() < 0.45) {
        const cut = Math.round(blockWidth * (0.3 + random() * 0.4));
        split(x, y, cut, blockHeight, depth - 1);
        split(x + cut, y, blockWidth - cut, blockHeight, depth - 1);
        return;
      }

      const cut = Math.round(blockHeight * (0.3 + random() * 0.4));
      split(x, y, blockWidth, cut, depth - 1);
      split(x, y + cut, blockWidth, blockHeight - cut, depth - 1);
    }

    const padding = 6;
    split(padding, padding, width - padding * 2, height - padding * 2, 4);

    blocks.forEach((block) => {
      ctx.fillStyle = colors.bgVar;
      ctx.globalAlpha = 0.2 + random() * 0.2;
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = colors.secondary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);
      ctx.globalAlpha = 1;

      const kind = random();
      if (kind < 0.3 && block.w > 20 && block.h > 20) {
        ctx.strokeStyle = colors.secondary;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 0.5;
        for (let lineY = block.y + 3; lineY < block.y + block.h - 2; lineY += 2) {
          ctx.beginPath();
          ctx.moveTo(block.x + 2, lineY + 0.5);
          ctx.lineTo(block.x + block.w - 2, lineY + 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (kind < 0.55 && block.w > 16 && block.h > 16) {
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = 0.4;
        const step = 3 + Math.floor(random() * 2);
        for (let y = block.y + 4; y < block.y + block.h - 3; y += step) {
          for (let x = block.x + 4; x < block.x + block.w - 3; x += step) {
            ctx.fillRect(x, y, 1.2, 1.2);
          }
        }
        ctx.globalAlpha = 1;
      } else if (kind < 0.75) {
        ctx.globalAlpha = 0.25;
        for (let offset = 3; offset < Math.min(block.w, block.h) / 2 - 2; offset += 4) {
          ctx.strokeStyle = colors.secondary;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            block.x + offset + 0.5,
            block.y + offset + 0.5,
            block.w - offset * 2 - 1,
            block.h - offset * 2 - 1
          );
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = 0.5;
      [
        [block.x + 2, block.y + 2],
        [block.x + block.w - 4, block.y + 2],
        [block.x + 2, block.y + block.h - 4],
        [block.x + block.w - 4, block.y + block.h - 4],
      ].forEach(([x, y]) => {
        ctx.fillRect(x, y, 1.5, 1.5);
      });
      ctx.globalAlpha = 1;
    });

    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 0.7;
    for (let index = 0; index < blocks.length; index += 1) {
      const current = blocks[index];
      const next = blocks[(index + 1 + Math.floor(random() * 2)) % blocks.length];
      const currentX = current.x + current.w / 2;
      const currentY = current.y + current.h;
      const nextX = next.x + next.w / 2;
      const nextY = next.y;
      ctx.strokeStyle = colors.secondary;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX, (currentY + nextY) / 2);
      ctx.lineTo(nextX, (currentY + nextY) / 2);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(currentX - 1, currentY - 1, 2, 2);
      ctx.fillRect(nextX - 1, nextY - 1, 2, 2);
      ctx.globalAlpha = 0.18;
    }
    ctx.globalAlpha = 1;
  }

  function drawHero() {
    const canvas = document.getElementById("page-hero");
    if (!canvas) {
      return;
    }

    drawChip(canvas, 0xc0ffee);
  }

  function sizePcie() {
    const pcie = document.querySelector(".page-hero-pcie");
    const wrap = document.querySelector(".page-hero-wrap");
    const nav = document.querySelector(".breadcrumb");
    if (!pcie || !wrap || !nav) {
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const gap = wrapRect.top - navRect.bottom;
    if (navRect.width === 0 || gap < 6) {
      pcie.style.display = "none";
      return;
    }

    pcie.style.display = "";
    pcie.style.left = "0";
    pcie.style.width = `${wrapRect.width}px`;
    pcie.style.top = `${navRect.bottom - wrapRect.top + 5}px`;
    pcie.style.height = `${gap - 5}px`;
    pcie.style.setProperty("--menu-offset-x", `${navRect.left - wrapRect.left}px`);
    pcie.style.setProperty("--menu-width", `${navRect.width}px`);
  }

  function init() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
    bindSteamTrigger();
    initArchitectureSampler();
    initPlanetsHome();

    drawHero();
    drawTimelineBackgrounds();
    sizePcie();

    window.addEventListener("resize", () => {
      drawHero();
      sizePcie();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sizePcie);
    }

    new MutationObserver(() => {
      drawHero();
      drawTimelineBackgrounds();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  if (!document.body.classList.contains("architecture-page")) {
    applyTheme(localStorage.getItem("theme") || "dark");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
