# Petit Theft Auto

A tiny, mobile-only parody crime game, playable as a PWA (installable web app).

**The pitch:** a full-scale, emotionally serious crime epic about an outlaw couple in a sunny swamp state, where every system is shrunk to its smallest form and everything is rendered in ultra-simple NES-style pixels. The text, dialogue and UI believe this is a prestige blockbuster. The screen shows three rectangles.

Status: playable start to finish. Eight missions (one optional), three endings, credits; radio, music and sound effects all generated in code.

**Play locally:** `python3 -m http.server -d app 8000`, then open http://localhost:8000 (phone or desktop). See [docs/tech.md](docs/tech.md).

## Tone rules

- **Deadpan.** The writing never acknowledges the graphics. Nobody winks.
- **Full-fidelity words, minimum-fidelity pictures.** Dialogue, prompts, toasts and radio read like a $2B game.
- **Every system exists, at doll-house scale:** wanted level, relationship meter, radio, phone, map.
- **Original everything.** Satirize themes and genres; never copy another game's names, characters, art or logos. No real brands or real people.

## Docs

- [Storyboard](docs/storyboard.md): beats, panel-by-panel scenes and frames
- [Characters](docs/characters.md): Lucita, Jase, the car
- [Radio](docs/radio/README.md): stations, ad scripts, audio tools and tech
- [Tech](docs/tech.md): how the game is built, run and deployed

## License

Planned: MIT for code, CC BY-SA 4.0 for art, music and voice.
