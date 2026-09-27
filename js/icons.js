/* pickpack - monochrome line icon set.
 * Every pictogram in the game is drawn here as inline SVG (24x24 grid).
 * No emoji or font glyphs are used for imagery. */
'use strict';

const Icons = (() => {
  const FLAME = 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.2 3.4-7.8.4 1.9 1.2 3 2.3 3.5C11.6 7.5 12.8 5 15 3c.2 3.1 1.2 4.9 2.4 6.6 1 1.4 1.6 3 1.6 5C19 18.3 16 21 12 21z';
  const SWORD = '<path d="M20 4v3.5l-8.5 8.5-3.5-3.5L16.5 4z"/><path d="M6.8 11.2l6 6M9.2 14.8 5.6 18.4"/><circle cx="4.6" cy="19.4" r="1.3"/>';
  const HEART = 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z';
  const DROP = 'M12 3.2c3.2 4.2 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.8-6.8 6-11z';
  const HEX = 'M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z';
  const SHIELD = 'M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6z';
  const small = (inner, s = 0.58, dy = 0) =>
    `<g transform="translate(12 ${12 + dy}) scale(${s}) translate(-12 -12)" stroke-width="${(1.6 / s).toFixed(2)}">${inner}</g>`;

  const P = {
    /* ---------- interface ---------- */
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M10 3 8 9l4 12 4-12-2-6"/>',
    heart: `<path d="${HEART}"/>`,
    deck: '<rect x="8" y="3.5" width="11" height="15" rx="1.6"/><path d="M5 7v11.5A2 2 0 0 0 7 20.5h8"/>',
    discard: '<rect x="4" y="3.5" width="11" height="15" rx="1.6"/><path d="M18 10v8.5a2 2 0 0 1-2 2H8.5"/><path d="M7.5 11h5M10.5 8.5 13 11l-2.5 2.5"/>',
    exhaust: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="2.5 2.5"/>',
    hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.4 4.5 4.2 4.5 6.5s-4.5 4.1-4.5 6.5V21M16.5 3v2.5c0 2.4-4.5 4.2-4.5 6.5s4.5 4.1 4.5 6.5V21"/>',
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m4.5 12.5 4.5 4.5 10-10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    soundOn: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    soundOff: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.7 4.7 0 0 0 7 18.5z"/>',
    user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c1-4 4.2-6 7.5-6s6.5 2 7.5 6"/>',
    logout: '<path d="M9.5 20.5h-4A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5h4"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/>',
    skip: '<path d="M4.5 6v12l7-6zM12.5 6v12l7-6z"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    question: '<path d="M9 9.2a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9v.6"/><path d="M12 17.6v.2"/>',
    warning: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.2"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    sparkle: '<path d="M12 3c.6 4.8 3.2 7.4 9 9-5.8 1.6-8.4 4.2-9 9-.6-4.8-3.2-7.4-9-9 5.8-1.6 8.4-4.2 9-9z"/>',
    cards: '<rect x="3.5" y="6" width="9" height="13" rx="1.5" transform="rotate(-12 8 12.5)"/><rect x="11" y="5" width="9" height="13" rx="1.5" transform="rotate(10 15.5 11.5)"/>',
    pack: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 7h14M5 17h14"/><path d="M12 9.2c.3 1.6 1 2.3 2.6 2.8-1.6.5-2.3 1.2-2.6 2.8-.3-1.6-1-2.3-2.6-2.8 1.6-.5 2.3-1.2 2.6-2.8z"/>',
    portal: '<ellipse cx="12" cy="12" rx="6.5" ry="9"/><ellipse cx="12" cy="12" rx="3" ry="5.5"/>',
    shard: '<path d="M12 2.5 17.5 9 12 21.5 6.5 9z"/><path d="M6.5 9h11"/>',
    levelUp: '<path d="m6 13 6-6 6 6M6 19l6-6 6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    swords: `${SWORD}<g transform="matrix(-1 0 0 1 24 0)">${SWORD}</g>`,
    glitch: '<path d="M4 6h10M8 10h12M4 14h7M13 14h7M6 18h9"/>',
    gravity: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M9.5 5.5 12 7l2.5-1.5M9.5 18.5 12 17l2.5 1.5M5.5 9.5 7 12l-1.5 2.5M18.5 9.5 17 12l1.5 2.5"/>',
    silence: '<path d="M12 4a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V8a4 4 0 0 0-4-4z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 11.4 4.3M12 18v3M4 4l16 16"/>',
    stun: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9 9l6 6M15 9l-6 6"/>',
    hex: `<path d="${HEX}"/>`,

    /* ---------- statuses ---------- */
    shield: `<path d="${SHIELD}"/>`,
    fracture: '<path d="M12 3 20 12 12 21 4 12z"/><path d="m12 3-1.5 5.5 3 2.5-2.5 4 1 6"/>',
    dim: '<circle cx="12" cy="12" r="7.5"/><path class="f" d="M12 4.5a7.5 7.5 0 0 0 0 15z"/>',
    wave: '<path d="M2.5 12h3l2.5-6 4 12 3-9 2 4.5 1.5-1.5h3"/>',
    ember: `<path d="${FLAME}"/><path d="M12 18c-1.5 0-2.5-1-2.5-2.4 0-1.5 1.2-2.3 1.8-3.6.8 1.6 3.2 2.2 3.2 3.9 0 1.2-1 2.1-2.5 2.1z"/>`,
    bloom: '<path d="M12 21v-9"/><path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5z"/><path d="M12 14.5c0-3-2-5-5.5-5 0 3.5 2 5 5.5 5z"/>',
    thorns: '<circle cx="12" cy="12" r="5"/><path d="M12 2.5 13.4 7h-2.8zM12 21.5 10.6 17h2.8zM2.5 12 7 10.6v2.8zM21.5 12 17 13.4v-2.8zM5.3 5.3l3.9 2.5-1.4 1.4zM18.7 18.7l-3.9-2.5 1.4-1.4zM5.3 18.7l2.5-3.9 1.4 1.4zM18.7 5.3l-2.5 3.9-1.4-1.4z"/>',
    stasis: `<path d="${HEX}"/><path d="M10 9v6M14 9v6"/>`,
    echo: '<path d="M8 8a5.5 5.5 0 0 0 0 8M5 5a10 10 0 0 0 0 14M16 8a5.5 5.5 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/><circle cx="12" cy="12" r="1.8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    orbit: '<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-35 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(35 12 12)"/>',
    vow: `<circle cx="12" cy="12" r="9.5"/>${small(`<path d="${FLAME}"/>`, 0.58, 0.4)}`,

    /* ---------- card art ---------- */
    sword: SWORD,
    dagger: '<path d="M12 2.5 14 5v9.5h-4V5z"/><path d="M7.5 14.5h9M12 14.5v4"/><circle cx="12" cy="20" r="1.3"/>',
    patch: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1" transform="rotate(-45 12 12)"/>',
    leaf: '<path d="M20 4c-9.5 0-15 5-15 13.5 0 .9.1 1.7.3 2.5 8.6 0 14.7-5.6 14.7-16z"/><path d="M4 20c3.5-3.5 7-7 11-11"/>',
    drop: `<path d="${DROP}"/><path d="M9.3 14.5a2.8 2.8 0 0 0 2.2 2.8"/>`,
    candle: '<rect x="9" y="11" width="6" height="10" rx="1"/><path d="M12 11V9"/><path d="M12 8.5c-1.4 0-2.2-.9-2.2-2.1 0-1.3 1-2 2.2-3.9 1.2 1.9 2.2 2.6 2.2 3.9 0 1.2-.8 2.1-2.2 2.1z"/>',
    root: '<path d="M12 14V9.5"/><path d="M12 9.5c0-3.2 2-5.3 6-5.3 0 3.6-2.2 5.3-6 5.3zM12 11c0-2.6-1.7-4.3-5-4.3 0 2.9 1.7 4.3 5 4.3z"/><path d="M3.5 14h17"/><path d="M12 14v6.5M12 17l-3.5 3M12 17l3.5 3"/>',
    dissolve: '<circle cx="10" cy="12" r="6" stroke-dasharray="3 2.2"/><path d="M18.5 8h.1M20.5 12h.1M18.5 16h.1"/>',
    veil: '<path d="M3 6c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 11.5c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 17c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>',
    blast: '<path d="M12 2l2 5.5 5.5-2.5-2.5 5.5L22 12l-5 1.5 2.5 5.5-5.5-2.5L12 22l-2-5.5-5.5 2.5 2.5-5.5L2 12l5-1.5L4.5 5l5.5 2.5z"/><circle cx="12" cy="12" r="2.5"/>',
    heartPlus: `<path d="${HEART}"/><path d="M12 10v5M9.5 12.5h5"/>`,
    link: '<path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5l1.8-1.8a4 4 0 0 1 5.6 5.6L16.5 12"/><path d="M13 17.5l-1.8 1.8a4 4 0 0 1-5.6-5.6L7.5 12"/>',
    wind: '<path d="M3 8.5h10a3 3 0 1 0-3-3"/><path d="M3 12.5h15a3 3 0 1 1-3 3"/><path d="M3 16.5h7"/>',
    mountain: '<path d="M2.5 19.5 9 8l3.5 6 2.5-3.5 6.5 9z"/><path d="M7.2 11.2 9 12.5l1.3-1.3"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M10 4.2l2 2 2-2M10 19.8l2-2 2 2M17.8 6.4 17 9.1l2.8.7M17.8 17.6 17 14.9l2.8-.7M6.2 17.6l.8-2.7-2.8-.7M6.2 6.4 7 9.1l-2.8.7"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7.5 7.5 0 0 0 10.5 10.5z"/>',
    pact: `<path d="${DROP}"/><path d="M8.5 17.5 15.5 10.5"/>`,
    wisp: '<path d="M6 20.5V11a6 6 0 0 1 12 0v9.5l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><path d="M10 10.5v.1M14 10.5v.1"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    comet: '<circle cx="16" cy="8" r="4"/><path d="M13 11 3.5 20.5M11 8.5 5 14.5M15.5 13 9.5 19"/>',
    vortex: '<path d="M12 12a1 1 0 0 1 2 0 2 2 0 0 1-4 0 3 3 0 0 1 6 0 4 4 0 0 1-8 0 5 5 0 0 1 10 0 6 6 0 0 1-12 0"/>',
    star5: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    storm: '<path d="M9.5 20c-3 0-5-2-5-4.8 0-2.5 1.7-4 2.6-6 .3 1.5.9 2.3 1.8 2.7.4-2.6 1.3-4.5 3-6 .1 2.4.9 3.8 1.8 5.1"/><path d="M13 13h7M14.5 16.5H21M13 20h6"/>',
    mirror: '<rect x="5.5" y="3" width="13" height="15" rx="6.5"/><path d="M12 18v3.5M8.5 21.5h7"/><path d="M9 8.5l3-2M9 11.5l6-4"/>',
    shuffle: '<path d="M3 7h3.5c5 0 6 10 11 10H21M3 17h3.5c5 0 6-10 11-10H21"/><path d="M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/>',
    collapse: '<path d="M4 4l6 6M10 5.5V10H5.5M20 4l-6 6M14 5.5V10h4.5M4 20l6-6M10 18.5V14H5.5M20 20l-6-6M14 18.5V14h4.5"/>',
    core: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="2 2.5"/><circle cx="12" cy="12" r="9.5"/>',
    crown: '<path d="M3.5 8 7.5 12 12 5l4.5 7 4-4-1.7 10.5H5.2z"/><path d="M5.5 21h13"/>',
    genesis: '<circle cx="12" cy="12" r="3"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><path d="M6.3 6.3l2.2 2.2M15.5 15.5l2.2 2.2M6.3 17.7l2.2-2.2M15.5 8.5l2.2-2.2"/>',
    infinity: '<path d="M12 12c-2-2.7-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1.3 5.5-4s3.5-4 5.5-4a4 4 0 0 1 0 8c-2 0-3.5-1.3-5.5-4z"/>',
    static: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 8.5h.1M11 8h.1M15.5 9h.1M8.5 12h.1M13 12.5h.1M17 12h.1M6.5 15.5h.1M11 16h.1M15 15.5h.1"/>',
    beacon: '<path d="M12 2.5v3M5.2 5.2l2.1 2.1M18.8 5.2l-2.1 2.1M2.5 12h3M18.5 12h3"/><path d="M8 21.5h8M9 21.5l1-6.5h4l1 6.5"/><circle cx="12" cy="11.5" r="3.5"/>',

    /* ---------- portraits ---------- */
    p_picker: '<path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5z"/><path d="M12 7.5l3.9 2.25v4.5L12 16.5l-3.9-2.25v-4.5z"/>',
    p_lumen: '<circle cx="12" cy="12" r="5"/><circle class="f" cx="12" cy="12" r="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    p_warden: '<path d="M5 21V9a7 7 0 0 1 14 0v12z"/><circle cx="12" cy="11" r="2"/><path d="M11 12.8 10 17h4l-1-4.2"/>',
    p_choir: '<circle cx="6" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M3 20v-4a3 3 0 0 1 6 0v4M9 20v-6.5a3 3 0 0 1 6 0V20M15 20v-4a3 3 0 0 1 6 0v4"/>',
    p_fracture: '<path d="M11 2.5 4.5 12l6.5 9.5-1-6.5 2-3-2-4z"/><path d="M13.5 1.5 20 11l-6.5 9.5-1-6.5 2-3-2-4z"/>',
    p_singularity: '<circle class="f" cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-20 12 12)"/><circle cx="12" cy="12" r="6" stroke-dasharray="1.5 2.5"/>',
    p_void: '<path d="M12 2 21 12 12 22 3 12z"/><path d="M7 12s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3z"/><circle class="f" cx="12" cy="12" r="1.3"/>'
  };

  function svg(name, cls = '') {
    const inner = P[name] || P.question;
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  }

  return { svg, has: (n) => Object.prototype.hasOwnProperty.call(P, n), names: () => Object.keys(P) };
})();
