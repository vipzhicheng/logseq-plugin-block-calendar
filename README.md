# Logseq Block Calendar

[![Github All Releases](https://img.shields.io/github/downloads/vipzhicheng/logseq-plugin-block-calendar/total.svg)](https://github.com/vipzhicheng/logseq-plugin-block-calendar/releases)

A plugin to render a calendar in block, so you can put it onto right side bar.

![screencast](./screencast.gif)

## Features

* Click date to jump to journal page.
* Month calendar: Switch month back and forth.
  * Back to today's month.
* Yearly calendar: Switch year back and forth.
  * Back to today's year.
* Show if journal page exist by showing a red dot.
* Show if task exists and finished on journal day.
* Support setting first day of week.
* Supported languages: `en`, `fr`,  `fa`, `de`, `zh-CN`, `zh-Hant`, `af`, `es`, `nb-NO`, `pt-BR`, `pt-PT`, `ru`, `ja`, `it`, `tr`, `ko`.

## Usage

- Slash command `/Insert Block Calendar` to insert a calendar for current month
- `{{renderer block-calendar, 2022, 7}}` to insert a calendar for specified month and year
- `{{renderer block-calendar, 2022, 7, en}}` to insert a calendar for specified language
- `{{renderer block-calendar, 2022, 7, en, nohead|nonav|noyear}}`
  - `nohead` means do not have table head, so no month and year and month switcher.
  - `nonav` means still have month and year, but no month switcher.
  - `noyear` means have month but not year.
  - These options could be set in various ways:
    - `nohead|nonav|noyear`
    - `nohead | nonav | noyear`
    - `nohead nonav noyear`
    - `nohead:nonav:noyear`
    - `nohead, nonav, noyear`

- Slash command `/Insert Block Yearly Calendar` to insert a yearly calendar for current year
- `{{renderer block-calendar-yearly, 2022}}` to insert a calendar for specified year
- `{{renderer block-calendar-yearly, 2022, en}}` to insert a calendar for specified language
- `{{renderer block-calendar-yearly, 2022, en, nohead|nonav}}`
  - `nohead` means do not have table head, so no month and year switcher.
  - `nonav` means still have year, but no year switcher.

## ❤️ Buy me a coffee

If you like this plugin and you will, you can choose to buy me a coffee via [this](https://www.buymeacoffee.com/vipzhicheng) and [this](https://afdian.net/@vipzhicheng), that means a lot to me.

## Licence
MIT
