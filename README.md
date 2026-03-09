# MatchZy Panel — Front-end for G5API

> **Fork of [Get5Vue](https://github.com/phlexplexico/g5v) by [PhlexPlexico](https://github.com/phlexplexico)**
> Maintained and extended by **[Iwhite](https://x.com/Iwhitecs)** (French-CSGO)

_**Status: Actively maintained.**_

---

MatchZy Panel is a Vue-based front-end for [G5API](https://github.com/French-CSGO/G5API), designed to manage CS2 competitive matches powered by the [MatchZy](https://github.com/shobhit-pathak/MatchZy) plugin.

## Features

- Add teams and players
- Add seasons/tournaments to track stats
- Add CS2 servers
- Create and control matches with live RCON commands
- Backup management — list and restore round backups directly from the panel
- Change match server with backup restore
- Dark mode
- Multi-language support (EN, FR, JP)
- Leaderboards and individual player stats
- Challonge bracket integration
- **5v5 Queue** — configurable queue (1–10 players), automatic match creation and real-time redirect via SSE
- **Toornament** — match pages per season, match creation pre-filled from Toornament API, schedule page per stage/round
- **Pterodactyl** — link CS2 servers to Pterodactyl panel, bulk link from admin interface, real-time server start status
- **Discord** — match announcement and live scoreboard

## Requirements

- [G5API](https://github.com/French-CSGO/G5API) running instance
- [MatchZy](https://github.com/French-CSGO/MatchZy) plugin on your CS2 server

## Building

```bash
yarn
yarn serve     # development server
yarn build     # production build → dist/
```

### Docker

```bash
# Light (requires yarn build first)
docker build -t yourname/matchzy-panel:latest -f DockerfileLight .
docker container run --name matchzy-panel -p 80:80 yourname/matchzy-panel:latest

# Full (builds inside container)
docker build -t yourname/matchzy-panel:latest -f DockerfileFull .
docker container run --name matchzy-panel -p 80:80 yourname/matchzy-panel:latest
```

The API URL defaults to `/api`. Override with:
```bash
docker build --build-arg VUE_APP_G5V_API_URL=https://your-api.example.com ...
```

### Docker Compose

See [docker-compose.yml](./docker-compose.yml) and [G5API](https://github.com/French-CSGO/G5API) for a full stack setup.

## Configuration

Key environment variable:
- `VUE_APP_G5V_API_URL` — G5API base URL (default: `/api`)

## Issues

- Match/stats issues → report to [G5API](https://github.com/French-CSGO/G5API/issues)
- Display/UI issues → report [here](https://github.com/French-CSGO/G5V/issues)

## Contributing

Pull requests are welcome. Please keep changes focused and document any new API calls.

## Credits

- **[PhlexPlexico](https://github.com/phlexplexico)** — original author of Get5Vue and G5API
- **[Iwhite](https://x.com/Iwhitecs)** — maintainer of this fork (French-CSGO)
- [Shugo "FlowingSPDG" Kawamura](https://github.com/FlowingSPDG) — initial translations
- [Sean Lewis](https://github.com/splewis) — creator of the original get5 plugin
- Smimabo — endless match API testing
- ebuttonsdude — hosting for testing
- [kubo6472](https://github.com/kubo6472) — GitHub Actions and Docker packages

## License

[MIT License](http://opensource.org/licenses/MIT). A copy of this license **must be included with the software**.
