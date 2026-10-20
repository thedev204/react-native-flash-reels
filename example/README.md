# Flash Reels Example

Expo (prebuild / continuous native generation) app that exercises `react-native-flash-reels`.

## Setup

From the repo root:

```sh
yarn
yarn example prebuild
```

`expo run:*` will also generate `android/` / `ios/` on first run if they are missing.

## Scripts

```sh
yarn example start          # Metro / Expo Dev Tools
yarn example android        # expo run:android
yarn example ios            # expo run:ios
yarn example prebuild       # generate native projects
yarn example prebuild:clean # regenerate native projects from scratch
```

Native `android/` and `ios/` folders are gitignored and produced by `expo prebuild`.
