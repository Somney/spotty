# Spotty

An ad-free music streaming app for Android and iOS (and the web), built with Expo / React Native.

## Where the music comes from

Spotty only plays music that is free to stream legally, which is why there are no ads and no account:

| Source | What you get |
| --- | --- |
| [Audius](https://audius.co) | Current music that artists publish themselves: trending charts, genres, playlists, search. |
| [Internet Archive](https://archive.org) 78rpm collection | Original records from 1900–1925, which are in the US public domain. |
| [Live Music Archive](https://archive.org/details/etree) | Full concert recordings shared with the bands' permission. |

It does not carry the major-label catalogue (that needs licensing deals).

## Features

- Home with trending charts by genre, fresh and underground releases, playlists, vintage records, live shows
- Artist pages, and a "Surprise me" button that plays a random set
- Search across all three sources, plus browse by genre and decade
- Full player: seek, shuffle, repeat, queue, background playback, lock screen controls
- Liked songs and listening history, stored on the device

## Install on Android

Every push builds an APK. Open the repository's **Releases** page on your phone, download
`spotty.apk` from **Latest Android build**, and open it (allow "install unknown apps" when asked).

## Develop

```bash
npm install
npx expo start          # press w for web
npx expo run:android    # native build, needs Android Studio
npx expo run:ios        # native build, needs a Mac with Xcode
npx tsc --noEmit        # typecheck
```

Lock screen controls and background playback need a native build; they are limited in Expo Go.

## Use on iPhone (web app)

The web version can be added to an iPhone home screen and opens full-screen like an app.
It is published to GitHub Pages by the **Web app** workflow once Pages is switched on:
repository **Settings > Pages > Source: GitHub Actions** (on a free GitHub plan the repository
must be public). Then open `https://<owner>.github.io/spotty/` in Safari and choose
**Share > Add to Home Screen**.

To build it yourself: `npm run build:web` writes the site to `dist/`.

## iOS (native)

The same code runs on iOS. Building an installable iOS app needs an Apple Developer account:
`npx eas-cli build --platform ios`.

## Layout

- `App.tsx` — tab shell and navigation
- `src/api` — Audius and Internet Archive clients
- `src/state` — playback engine (`player.tsx`) and saved library (`library.tsx`)
- `src/screens`, `src/components` — UI
