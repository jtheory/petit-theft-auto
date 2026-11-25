// Radio content. Everything here is data: replace a song's notes, or (later) point a track
// at a recorded file, without touching the engine.
//
// Song format: one token per eighth note.  C4 F#3 Bb2 = notes   . = rest   - = hold   | = bar (ignored)
// Drum tokens: k kick, s snare, h hat, c crash.
// Waves: pulse12 / pulse25 / pulse50 (NES duty cycles), triangle, drums.
// Program items can carry `before: 'flag'` or `after: 'flag'` to follow the story (see Radio.setContext).

export default {
  voices: {
    nova:        { wave: 'pulse50',  pitch: 330, range: 0.35, rate: 0.055, blip: 0.05,  vol: 0.08 },
    boone:       { wave: 'pulse25',  pitch: 140, range: 0.30, rate: 0.060, blip: 0.06,  vol: 0.09 },
    merle:       { wave: 'triangle', pitch: 170, range: 0.20, rate: 0.075, blip: 0.08,  vol: 0.22 },
    brayden:     { wave: 'pulse12',  pitch: 290, range: 0.60, rate: 0.040, blip: 0.04,  vol: 0.08 },
    dana:        { wave: 'pulse50',  pitch: 235, range: 0.22, rate: 0.050, blip: 0.045, vol: 0.08 },
    caller:      { wave: 'pulse25',  pitch: 205, range: 0.55, rate: 0.052, blip: 0.05,  vol: 0.09 },
    randy:       { wave: 'triangle', pitch: 125, range: 0.18, rate: 0.072, blip: 0.09,  vol: 0.24 },
    chuck:       { wave: 'pulse25',  pitch: 180, range: 0.45, rate: 0.044, blip: 0.045, vol: 0.10 },
    testimonial: { wave: 'triangle', pitch: 230, range: 0.05, rate: 0.060, blip: 0.06,  vol: 0.2 },
    skye:        { wave: 'triangle', pitch: 300, range: 0.30, rate: 0.075, blip: 0.09,  vol: 0.2 },
    narrator:    { wave: 'pulse12',  pitch: 95,  range: 0.20, rate: 0.065, blip: 0.07,  vol: 0.1 },
    kid:         { wave: 'pulse50',  pitch: 480, range: 0.30, rate: 0.050, blip: 0.045, vol: 0.06 },
    fine:        { wave: 'pulse50',  pitch: 360, range: 0.15, rate: 0.018, blip: 0.02,  vol: 0.05 },
  },

  songs: {
    midnight: {
      title: 'Midnight Coastline', artist: 'The Velvet Tides', bpm: 100,
      tracks: {
        lead:  { wave: 'pulse25',  vol: 0.09, notes: 'E5 - - D5 C5 - A4 - | C5 - D5 - E5 - G5 -' },
        arp:   { wave: 'pulse12',  vol: 0.05, gate: 0.6, notes: 'A3 C4 E4 C4 F3 A3 C4 A3 | C4 E4 G4 E4 G3 B3 D4 B3' },
        bass:  { wave: 'triangle', vol: 0.30, notes: 'A2 - A2 - F2 - F2 - | C3 - C3 - G2 - G2 -' },
        drums: { wave: 'drums',    vol: 0.9,  notes: 'k . h . s . h . | k . h k s . h h' },
      },
    },
    mudflap: {
      title: 'Mud Flap Heart', artist: 'Cypress Knee', bpm: 140,
      tracks: {
        lead:  { wave: 'pulse25',  vol: 0.08, notes: 'E4 - G4 E4 A4 - G4 E4 | B4 - A4 G4 E4 - - -' },
        stab:  { wave: 'pulse50',  vol: 0.04, gate: 0.4, notes: 'E4 . E4 . A4 . A4 . | E4 . E4 . B4 . A4 .' },
        bass:  { wave: 'triangle', vol: 0.30, notes: 'E2 - B2 - A2 - B2 - | E2 - B2 - B2 - A2 -' },
        drums: { wave: 'drums',    vol: 0.9,  notes: 'k . s . k k s . | k . s . k . s s' },
      },
    },
    gloria: {
      title: "Gloria's Song (For Gloria)", artist: 'The Sunset Isles Quartet', bpm: 84,
      tracks: {
        sax:   { wave: 'pulse50',  vol: 0.07, notes: 'A4 - - G4 F4 - E4 - | D4 - - - E4 - C#5 -' },
        pad:   { wave: 'pulse12',  vol: 0.035, notes: 'F4 - - - F4 - - - | E4 - - - C#4 - - -' },
        bass:  { wave: 'triangle', vol: 0.30, notes: 'D2 - A2 - G2 - D2 - | C2 - G2 - A2 - E2 -' },
        drums: { wave: 'drums',    vol: 0.5,  notes: 'h . s h h . s . | h . s h h . s h' },
      },
    },
    lowkey: {
      title: 'Lowkey Highkey', artist: 'Brayden Vibez', bpm: 150,
      tracks: {
        lead:  { wave: 'pulse12',  vol: 0.08, gate: 0.5, notes: 'C5 C5 . C5 Eb5 . C5 . | Bb4 Bb4 . G4 . . . .' },
        bass:  { wave: 'triangle', vol: 0.34, notes: 'C2 . . C2 . . C2 . | Ab1 . . Ab1 . . Bb1 .' },
        drums: { wave: 'drums',    vol: 1.0,  notes: 'k . h k s . h h | k k h . s . h s' },
      },
    },
    bumper: {
      title: 'Action 7 News Theme', artist: 'Action 7', bpm: 120,
      tracks: {
        lead:  { wave: 'pulse25',  vol: 0.09, notes: 'C5 . G4 . C5 . E5 - | D5 - - - - - . .' },
        harm:  { wave: 'pulse12',  vol: 0.05, notes: 'E4 . E4 . E4 . G4 - | F#4 - - - - - . .' },
        bass:  { wave: 'triangle', vol: 0.30, notes: 'C3 . C3 . C3 . C3 . | D3 - - - - - . .' },
        drums: { wave: 'drums',    vol: 0.9,  notes: 'k . . . k . . . | c . . . . . . .' },
      },
    },
    // ad beds
    organ: {
      title: 'Eternal Shores', artist: '', bpm: 66,
      tracks: {
        a:    { wave: 'pulse50',  vol: 0.04, notes: 'C4 - - - - - - - | F4 - - - - - - -' },
        b:    { wave: 'pulse50',  vol: 0.04, notes: 'E4 - - - - - - - | A4 - - - - - - -' },
        bass: { wave: 'triangle', vol: 0.25, notes: 'C3 - - - - - - - | F2 - - - - - - -' },
      },
    },
    sting: {
      title: '1-800-CHOMPED', artist: '', bpm: 150,
      tracks: {
        riff:  { wave: 'pulse25',  vol: 0.07, gate: 0.7, notes: 'E4 E4 G4 E4 A4 G4 E4 . | E4 E4 G4 E4 B4 A4 G4 .' },
        bass:  { wave: 'triangle', vol: 0.30, notes: 'E2 . E2 . E2 . E2 . | E2 . E2 . G2 . A2 .' },
        drums: { wave: 'drums',    vol: 0.8,  notes: 'k . s . k k s . | k . s . k . s s' },
      },
    },
    lofi: {
      title: 'Primal Glow', artist: '', bpm: 72,
      tracks: {
        keys:  { wave: 'pulse12',  vol: 0.05, notes: 'A3 - C4 - E4 - G4 - | F3 - A3 - C4 - E4 -' },
        bass:  { wave: 'triangle', vol: 0.28, notes: 'A2 - - - - - - - | F2 - - - - - - -' },
        drums: { wave: 'drums',    vol: 0.6,  notes: 'k . h . s . h . | k . h k s . h .' },
      },
    },
    war: {
      title: 'Call of Obligation', artist: '', bpm: 120,
      tracks: {
        horn:  { wave: 'pulse12',  vol: 0.07, notes: '. . . . . . . . | B4 - - - A#4 - - -' },
        bass:  { wave: 'triangle', vol: 0.32, notes: 'E2 . E2 . E2 . F2 . | E2 . E2 . E2 . G2 F2' },
        drums: { wave: 'drums',    vol: 1.0,  notes: 'k k s . k k s k | k k s . k s s c' },
      },
    },
  },

  ads: {
    eternal: {
      sponsor: 'Eternal Shores Fellowship & Vacation Ownership', bed: 'organ',
      lines: [
        ['Pastor Randy', 'randy', 'Have you ever stood on a beach at sunset and thought: I want this forever?'],
        ['Pastor Randy', 'randy', "At Eternal Shores Fellowship and Vacation Ownership, forever isn't a promise. It's a payment plan."],
        ['Pastor Randy', 'randy', "The Lord said, in my Father's house are many rooms. And Eternal Shores said: what if you owned one week a year of one of them?"],
        ['Pastor Randy', 'randy', 'Eternal Shores. Your salvation. Your square footage.'],
        ['Fine print', 'fine', 'Oceanview means view of a body of water, including retention ponds. Ownership is perpetual and cannot be exited in this life or the next. Eternal Shores is not responsible for Rapture-related scheduling conflicts.'],
      ],
    },
    chuck: {
      sponsor: 'Chuck Brannigan, Attorney at Law', bed: 'sting',
      lines: [
        ['Chuck Brannigan', 'chuck', 'Were you bitten, startled, or emotionally diminished by an alligator? On a golf course? In your pool? At a Waffle Barn?'],
        ['Chuck Brannigan', 'chuck', "I'm Chuck Brannigan, and I've been fighting reptiles in the courtroom for twenty-two years."],
        ['Satisfied client', 'testimonial', "A gator took my husband's leg and our pontoon. Chuck got me the pontoon back."],
        ['Chuck Brannigan', 'chuck', 'The gator does not have a lawyer. But you can. Call 1-800-CHOMPED. Hablamos Español. Hablamos Gator.'],
        ['Fine print', 'fine', 'Chuck Brannigan has never won a case against an alligator. Alligators cannot be served.'],
      ],
    },
    primal: {
      sponsor: 'Primal Glow', bed: 'lofi',
      lines: [
        ['Skye', 'skye', "Hey, beautiful souls. It's Skye. I used to wake up feeling... inflamed. Spiritually. And dermally."],
        ['Skye', 'skye', 'Then I found Primal Glow. Wild-harvested gator collagen, cold-pressed under a full moon by men who do not wish to be named.'],
        ['Skye', 'skye', 'Use code SKYE20 for twenty percent off your first jar and your first emotional breakthrough.'],
        ['Fine print', 'fine', 'These statements have not been evaluated by the FDA, the FBI, or any gator. Do not use within Bluetooth range of your ex.'],
      ],
    },
    cod: {
      sponsor: 'Call of Obligation: Modern Obligations IV', bed: 'war',
      lines: [
        ['Narrator', 'narrator', 'This November, war has a new season pass. Call of Obligation: Modern Obligations Four.'],
        ['Narrator', 'narrator', 'Featuring the same map as last year. But at night.'],
        ['Kid', 'kid', 'Dad... is this the one we already have?'],
        ['Narrator', 'narrator', "It's a different one. Pre-order now for early access to the ability to pre-order the DLC."],
        ['Fine print', 'fine', 'Requires 340 gigabytes. Internet connection required for single-player. Single-player not included.'],
      ],
    },
  },

  stations: [
    {
      id: 'neon', freq: '88.8', band: 'FM', name: 'Neon 88.8', tagline: 'Synthwave', bed: 'midnight',
      program: [
        { song: 'midnight', loops: 3 },
        { label: 'DJ Nova', lines: [['Nova', 'nova', "That was Midnight Coastline, by The Velvet Tides. The sun is setting. It has been setting for a while now. Here it is again."]] },
        { song: 'midnight', loops: 3 },
        { ad: 'primal' },
        { song: 'midnight', loops: 2 },
        { label: 'DJ Nova', lines: [['Nova', 'nova', 'Neon eighty-eight point eight. If the sky were a song, it would be this one. It is this one.']] },
        { song: 'midnight', loops: 3 },
        { ad: 'cod' },
      ],
    },
    {
      id: 'gator', freq: '97.3', band: 'FM', name: 'WGTR "The Gator"', tagline: 'Swamp rock', bed: 'mudflap',
      program: [
        { song: 'mudflap', loops: 3 },
        { label: 'Fishing report', lines: [['Boone', 'boone', 'Fishing report. Red snapper biting off Pelican Key. Also the silver ghost-bass, which has never been photographed. Bring a net and an open mind.']] },
        { song: 'mudflap', loops: 3 },
        { ad: 'chuck' },
        { song: 'mudflap', loops: 2 },
        { label: 'Boone', lines: [['Boone', 'boone', "WGTR, The Gator. If you can hear this, you're in the swamp. That was Mud Flap Heart. It's coming back around."]] },
        { song: 'mudflap', loops: 3 },
        { ad: 'eternal' },
      ],
    },
    {
      id: 'seniors', freq: '101.1', band: 'FM', name: 'Smooth Seniors 101.1', tagline: 'Retiree smooth jazz', bed: 'gloria',
      program: [
        { song: 'gloria', loops: 2 },
        { label: 'Dedications', lines: [['DJ Merle', 'merle', "This one goes out to Gloria, who passed in March. She'd have loved this saxophone."]] },
        { song: 'gloria', loops: 2 },
        { ad: 'eternal' },
        { song: 'gloria', loops: 2 },
        { label: 'Dedications', lines: [['DJ Merle', 'merle', "And this one's for Harold. Harold, if you're listening, you're not. Rest easy, Harold."]] },
        { song: 'gloria', loops: 2 },
        { ad: 'chuck' },
      ],
    },
    {
      id: 'viral', freq: '104.9', band: 'FM', name: 'WVIRAL', tagline: 'Influencer talk & hype', bed: 'lowkey',
      program: [
        { song: 'lowkey', loops: 3 },
        { label: 'Brayden', lines: [['Brayden', 'brayden', "Yo! That was Lowkey Highkey by Brayden Vibez, which is me. Link in bio. The bio is also me."]] },
        { song: 'lowkey', loops: 3 },
        { ad: 'primal' },
        { label: 'Brayden', lines: [['Brayden', 'brayden', 'Shout out to everybody streaming. Shout out to the algorithm. I see you. Please see me.']] },
        { song: 'lowkey', loops: 3 },
        { ad: 'cod' },
      ],
    },
    {
      id: 'talk', freq: '1490', band: 'AM', name: 'Talk 1490', tagline: 'News & call-in', bed: null,
      program: [
        { song: 'bumper', loops: 1 },
        // Before Mission 3 the news is about a porch. After it, the news is about you.
        { label: 'Action 7 News', bed: null, before: 'robbedStore', lines: [
          ['Dana Reyes', 'dana', 'Action 7 news at the top of the hour. A Port Mangrove man has repainted his porch, reportedly without approval from the homeowners association.'],
          ['Dana Reyes', 'dana', 'The HOA is calling the color, quote, a provocation. More at eleven.'],
        ] },
        { label: 'Action 7 News', bed: null, after: 'robbedStore', lines: [
          ['Dana Reyes', 'dana', 'Action 7 news at the top of the hour. A convenience store on Route 9 was robbed by two suspects described by witnesses as, quote, a couple, probably.'],
          ['Dana Reyes', 'dana', 'Police ask the public not to give the suspects a heart on social media, which, quote, only encourages them.'],
        ] },
        { label: 'Call-in', bed: null, lines: [
          ['Dana Reyes', 'dana', "Line two, you're on Talk fourteen-ninety."],
          ['Caller', 'caller', 'Yeah, hi. My neighbor painted his porch blue. Without asking anybody.'],
          ['Dana Reyes', 'dana', 'Is that a crime?'],
          ['Caller', 'caller', 'It should be.'],
        ] },
        { ad: 'eternal' },
        { song: 'bumper', loops: 1 },
        { label: 'Action 7 News', bed: null, lines: [
          ['Dana Reyes', 'dana', 'Also tonight: is your lawn sprinkler a socialist? Our I-Team investigates.'],
          ['Dana Reyes', 'dana', 'Action 7. We were there. Eventually.'],
        ] },
        { ad: 'chuck' },
      ],
    },
  ],
};
