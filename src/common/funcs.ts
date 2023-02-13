import "@logseq/libs";

import { format, toDate, utcToZonedTime, formatInTimeZone } from "date-fns-tz";
import { getDateForPageWithoutBrackets } from "logseq-dateutils";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
dayjs.extend(isToday);

import getLangFunc from "../lang";

export function print(msg: string) {
  console.info(`#${logseq.baseInfo.id}: ${msg}`);
}

function leapYear(year: number) {
  if (year % 4 == 0)
    // basic rule
    return true; // is leap year
  /* else */ // else not needed when statement is "return"
  return false; // is not leap year
}

function getDays(month: number, year: number) {
  // create array to hold number of days in each month
  const ar = new Array(12);
  ar[0] = 31; // January
  ar[1] = leapYear(year) ? 29 : 28; // February
  ar[2] = 31; // March
  ar[3] = 30; // April
  ar[4] = 31; // May
  ar[5] = 30; // June
  ar[6] = 31; // July
  ar[7] = 31; // August
  ar[8] = 30; // September
  ar[9] = 31; // October
  ar[10] = 30; // November
  ar[11] = 31; // December

  // return number of days in the specified month (parameter)
  return ar[month];
}

function getMonthName(month: number, lang: any) {
  // create array to hold name of each month
  const ar = new Array(12);
  ar[0] = lang.January;
  ar[1] = lang.February;
  ar[2] = lang.March;
  ar[3] = lang.April;
  ar[4] = lang.May;
  ar[5] = lang.June;
  ar[6] = lang.July;
  ar[7] = lang.August;
  ar[8] = lang.September;
  ar[9] = lang.October;
  ar[10] = lang.November;
  ar[11] = lang.December;

  // return name of specified month (parameter)
  return ar[month];
}

function isInteger(x: number | string) {
  // source: https://stackoverflow.com/a/59459179
  return Number.isInteger(Number(x)) && x !== null;
}

export function parseYearMonth(year: any, month: any, now: Date = new Date()) {
  const year4 = isInteger(year) ? Number(year) : now?.getFullYear() || null;
  const month0 = isInteger(month) ? Number(month) - 1 : now?.getMonth() || null;
  return [year4, month0];
}

export function parseOptions(
  arr: string | string[],
  delimeters: string = " |:"
): string[] {
  if (Array.isArray(arr)) {
    if (arr.length !== 1) {
      return arr;
    }

    [arr] = arr;
  }

  let options: string = arr || "";
  if (!options) {
    return [];
  }

  return options.split(new RegExp(`[${delimeters}]+`));
}

export const copyToClipboard = (str: string) => {
  const el = top?.document.createElement("textarea");
  if (el) {
    el.value = str;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    top?.document.body.appendChild(el);

    const selection = top?.document.getSelection();
    if (selection) {
      const selected =
        selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
      el.select();
      top?.document.execCommand("copy");
      top?.document.body.removeChild(el);
      if (selected) {
        selection.removeAllRanges();
        selection.addRange(selected);
      }
    }
  }
};

export async function setCal(
  year4: number,
  month0: number,
  slot: string,
  language: string = "",
  options: string[] = []
) {
  clearCachedDays();
  const getLang = getLangFunc(logseq.settings?.defaultLanguage);
  const lang = getLang(language);

  const now = new Date();
  const monthName = getMonthName(month0, lang);
  const date = now.getDate();
  // create instance of first day of month, and extract the day on which it occurs
  const firstDayInstance = new Date(year4, month0, 1);
  const firstDay = firstDayInstance.getDay();

  // number of days in current month
  const days = getDays(month0, year4);

  // call function to draw calendar
  return await drawCal(
    firstDay + 1,
    days,
    date,
    month0,
    monthName,
    year4,
    slot,
    lang,
    language,
    options
  );
}

let journalDays: number[] = [];
async function getJournalDays(year: number, month: number) {
  if (journalDays.length === 0) {
    const journals = await _getCurrentRepoRangeJournals(year, month + 1);
    const journalsReduce = journals.reduce((ac: any, it: any) => {
      const k = it[`journal-day`].toString();
      ac[k] = it;
      return ac;
    }, {});

    journalDays = Object.keys(journalsReduce)
      .map((it: any) => {
        const d = dayjs(journalsReduce[it][`journal-day`].toString());
        if (d.isValid()) {
          return d.date();
        }
        return 0;
      })
      .filter((it) => it > 0);
  }

  return journalDays;
}

let undoneTaskDays: number[] = [];
async function getUndoneTaskDays(year: number, month: number) {
  if (undoneTaskDays.length === 0) {
    const undoneTaskJournals = await _getCurrentRepoRangeUndoneTaskJournals(
      year,
      month + 1
    );
    const undoneTaskJournalsReduce = undoneTaskJournals.reduce(
      (ac: any, it: any) => {
        const k = it[`journal-day`].toString();
        ac[k] = it;
        return ac;
      },
      {}
    );

    undoneTaskDays = Object.keys(undoneTaskJournalsReduce)
      .map((it: any) => {
        const d = dayjs(undoneTaskJournalsReduce[it][`journal-day`].toString());
        if (d.isValid()) {
          return d.date();
        }
        return 0;
      })
      .filter((it) => it > 0);
  }

  return undoneTaskDays;
}

let doneTaskDays: number[] = [];
async function getDoneTaskDays(year: number, month: number) {
  if (doneTaskDays.length === 0) {
    const doneTaskJournals = await _getCurrentRepoRangeDoneTaskJournals(
      year,
      month + 1
    );
    const doneTaskJournalsReduce = doneTaskJournals.reduce(
      (ac: any, it: any) => {
        const k = it[`journal-day`].toString();
        ac[k] = it;
        return ac;
      },
      {}
    );

    doneTaskDays = Object.keys(doneTaskJournalsReduce)
      .map((it: any) => {
        const d = dayjs(doneTaskJournalsReduce[it][`journal-day`].toString());
        if (d.isValid()) {
          return d.date();
        }
        return 0;
      })
      .filter((it) => it > 0);
  }

  return doneTaskDays;
}

export function clearCachedDays() {
  journalDays = [];
  undoneTaskDays = [];
  doneTaskDays = [];
}

export async function drawCal(
  firstDay: number,
  lastDate: number,
  date: number,
  month: number,
  monthName: string,
  year: number,
  slot: string,
  lang: any,
  language: string,
  options: string[]
) {
  const now = new Date();

  const config = await logseq.App.getUserConfigs();

  const journalDays = await getJournalDays(year, month);
  const undoneTaskDays = await getUndoneTaskDays(year, month);
  const doneTaskDays = await getDoneTaskDays(year, month);

  let previousMonth = month - 1;
  let previousMonthYear = year;
  if (previousMonth < 0) {
    previousMonth = previousMonth + 12;
    previousMonthYear--;
  }

  let nextMonth = month + 1;
  let nextMonthYear = year;
  if (nextMonth > 11) {
    nextMonth = nextMonth - 12;
    nextMonthYear++;
  }

  // create basic table structure
  let text = ""; // initialize accumulative variable to empty string
  text += '<table class="logseq-block-calendar">'; // table settings

  if (!options.includes("nohead")) {
    if (!options.includes("nonav")) {
      text += '<th COLSPAN=4 class="calendar-title">'; // create table header cell
      if (!options.includes("noyear")) {
        text += `<span class="calendar-month">${monthName}</span> <span class="calendar-year">${year}</span>`;
      } else {
        text += `<span class="calendar-month">${monthName}</span>`;
      }
      text += "</th>";

      text += '<th COLSPAN=3 class="calendar-nav">'; // close header cell

      text += `<a class="button inline-button no-padding-button" data-year="${previousMonthYear}" data-month="${
        previousMonth + 1
      }" data-slot="${slot}" data-language="${language}" data-options="${options.join(
        " "
      )}" data-on-click="loadCalendar" title="Jump to previous month."><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="15 6 9 12 15 18" />
    </svg></a> <a class="button inline-button padding-button" data-year="${now.getFullYear()}" data-month="${
        now.getMonth() + 1
      }" data-slot="${slot}" data-language="${language}" data-options="${options.join(
        " "
      )}" data-on-click="loadCalendar" title="Jump back to current month.">${
        lang.Today
      }</a> <a class="button inline-button no-padding-button" data-year="${nextMonthYear}" data-month="${
        nextMonth + 1
      }" data-slot="${slot}" data-language="${language}" data-options="${options.join(
        " "
      )}" data-on-click="loadCalendar" title="Jump to next month"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="9 6 15 12 9 18" />
    </svg></a>`;
      text += "</th>";
    } else {
      text += '<th COLSPAN=7 class="calendar-title">'; // create table header cell
      if (!options.includes("noyear")) {
        text += `<span class="calendar-month">${monthName}</span> <span class="calendar-year">${year}</span>`;
      } else {
        text += `<span class="calendar-month">${monthName}</span>`;
      }
      text += "</th>";
    }
  }

  // variables to hold constant settings
  const openCol = "<td>";
  const closeCol = "</td>";

  // create array of abbreviated day names
  const weekDay = new Array(7);

  const firstDayOfWeek = logseq.settings?.firstDayOfWeek || "sunday";

  // @ts-ignore
  if (firstDayOfWeek === "sunday") {
    weekDay[0] = lang.Sunday;
    weekDay[1] = lang.Monday;
    weekDay[2] = lang.Tuesday;
    weekDay[3] = lang.Wednesday;
    weekDay[4] = lang.Thursday;
    weekDay[5] = lang.Friday;
    weekDay[6] = lang.Saturday;
  } else {
    weekDay[0] = lang.Monday;
    weekDay[1] = lang.Tuesday;
    weekDay[2] = lang.Wednesday;
    weekDay[3] = lang.Thursday;
    weekDay[4] = lang.Friday;
    weekDay[5] = lang.Saturday;
    weekDay[6] = lang.Sunday;
  }

  // create first row of table to set column width and specify week day
  text += '<tr class="calendar-head" align="center" valign="center">';
  for (let dayNum = 0; dayNum < 7; ++dayNum) {
    text += openCol + weekDay[dayNum] + closeCol;
  }
  text += "</tr>";

  // declaration and initialization of two variables to help with tables
  let digit = 1;
  let curCell = 1;

  while (true) {
    if (digit > lastDate) break;
    text += '<tr align="center" valign="top">';
    for (let col = 1; col <= 7; ++col) {
      if (digit > lastDate) break;

      // @ts-ignore
      if (
        curCell <
        (firstDayOfWeek === "sunday"
          ? firstDay
          : firstDay - 1 > 0
          ? firstDay - 1
          : 7)
      ) {
        text += `<td></td>`;
        curCell++;
      } else {
        // const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // const journalTitle = formatInTimeZone(
        //   new Date(`${year}-${month + 1}-${digit}`),
        //   timezone,
        //   config.preferredDateFormat
        // );
        const journalTitle = getDateForPageWithoutBrackets(
          new Date(year, month, digit),
          config.preferredDateFormat
        );

        const recordsClass = "calendar-day-rec";
        const hasJournal =
          logseq.settings?.enableDot && journalDays.includes(digit);
        const hasUndoneTask =
          logseq.settings?.enableDot && undoneTaskDays.includes(digit);
        const hasDoneTask =
          logseq.settings?.enableDot && doneTaskDays.includes(digit);
        let dayClass = "";
        if (
          (date > digit &&
            year === now.getFullYear() &&
            month === now.getMonth()) ||
          month < now.getMonth()
        ) {
          dayClass = "calendar-day-past";
        }
        if (
          date === digit &&
          year === now.getFullYear() &&
          month === now.getMonth()
        ) {
          dayClass = "calendar-day-today";
        }
        text +=
          "<td>" +
          `<a class="calendar-day ${recordsClass} button inline-button ${dayClass}" data-type="day" data-value="${journalTitle}" data-on-click="processJump">${digit}${
            hasJournal && !hasDoneTask && !hasUndoneTask
              ? '<span class="dot-journal-without-task"></span>'
              : hasJournal && hasUndoneTask
              ? '<span class="dot-journal-with-task"></span><span class="dot-task-undone"></span>'
              : hasJournal && hasDoneTask
              ? '<span class="dot-journal-with-task"></span><span class="dot-task-done"></span>'
              : ""
          }` +
          "</td>";
        digit++;
      }
    }
    text += "</tr>";
  }

  // close all basic table tags
  text += "</table>";

  return text;
}

/**
 *
 * @see https://github.com/xyhp915/logseq-journals-calendar/blob/main/src/App.vue#L170
 * @param year
 * @param month
 * @returns
 */
async function _getCurrentRepoRangeJournals(year: number, month: number) {
  const my = year + (month < 10 ? "0" : "") + month;
  let ret;
  try {
    ret = await logseq.DB.datascriptQuery(`
      [:find (pull ?p [*])
       :where
       [?b :block/page ?p]
       [?p :block/journal? true]
       [?p :block/journal-day ?d]
       [(>= ?d ${my}01)] [(<= ?d ${my}31)]]
    `);
  } catch (e) {
    console.error(e);
  }
  return (ret || []).flat();
}

async function _getCurrentRepoRangeUndoneTaskJournals(
  year: number,
  month: number
) {
  const my = year + (month < 10 ? "0" : "") + month;
  let ret;
  try {
    ret = await logseq.DB.datascriptQuery(`
      [:find (pull ?p [*])
        :where
        [?b :block/marker ?marker]
        [(contains? #{"NOW" "LATER" "TODO" "DOING", "WAITING"} ?marker)]
        [?b :block/page ?p]
        [?p :block/journal? true]
        [?p :block/journal-day ?d]
        [(>= ?d ${my}01)] [(<= ?d ${my}31)]]
      ]
    `);
  } catch (e) {
    console.error(e);
  }
  return (ret || []).flat();
}

async function _getCurrentRepoRangeDoneTaskJournals(
  year: number,
  month: number
) {
  const my = year + (month < 10 ? "0" : "") + month;
  let ret;
  try {
    ret = await logseq.DB.datascriptQuery(`
      [:find (pull ?p [*])
        :where
        [?b :block/marker ?marker]
        [(contains? #{"DONE"} ?marker)]
        [?b :block/page ?p]
        [?p :block/journal? true]
        [?p :block/journal-day ?d]
        [(>= ?d ${my}01)] [(<= ?d ${my}31)]]
      ]
    `);
  } catch (e) {
    console.error(e);
  }
  return (ret || []).flat();
}

export function provideStyle(opts: any = {}) {
  const {} = opts;
  logseq.provideStyle({
    key: "block-calendar",
    style: `
    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"]  {
      display: flex;
      flex-direction: column;
    }

    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .logseq-block-calendar:not(:nth-child(${
      logseq.settings?.yearlyColumns || 3
    }n)) {
      border-right: 1px solid #eee;
    }

    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .header .inline-button  {
      display: inline-block;
      height: 2.6rem;
    }
    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .header  {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .controls  {
      display: flex;
    }
    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .calendar-header-title  {
      font-weight: bold;
      font-size: 1.5em;
      height: 60px;
    }

    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .logseq-block-calendar .calendar-title  {
      font-weight: bold;
      font-size: 1em;
      height: 40px;
    }

    [id^="logseq-plugin-block-calendar--block-calendar-yearly-slot"] .yearly-months {
       display: grid !important;
       grid-template-columns: repeat(${logseq.settings?.yearlyColumns || 3}, ${
      100 / (logseq.settings?.yearlyColumns || 3)
    }%);
      gap: 10px;
    }

    .logseq-block-calendar {
      width: ${logseq.settings?.tableWidth || "100%"};
      user-select: none;
      margin: 0;
      table-layout:fixed;
      min-width: 295px;
    }
    .logseq-block-calendar .calendar-title {
      font-weight: normal;
    }
    .logseq-block-calendar .inline-button {
      display: inline-block;
    }

    .logseq-block-calendar .no-padding-button {
      padding: 0;
      height: inherit;
    }
    .logseq-block-calendar .padding-button {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      height: inherit;
    }
    .logseq-block-calendar tr:nth-child(even) {
      background-color: transparent;
    }
    .logseq-block-calendar tr:nth-child(odd) {
      background-color: transparent;
    }
    .logseq-block-calendar th {
      border-bottom: 0;
      font-size: 20px;
      font-weight: bold;
      padding: 4px;
    }
    .logseq-block-calendar td {
      font-size: 14px;
      padding: 0;
      text-align: center;
    }

    .logseq-block-calendar .calendar-head {
      font-weight: bold;
      color: #999999;
    }

    .logseq-block-calendar a {
      color: var(--ls-primary-text-color);
    }

    .logseq-block-calendar .calendar-day-today {
      font-weight: bold;
      color: var(--ls-link-text-color);
    }

    .logseq-block-calendar .calendar-day-past {
      color: #999999;
    }

    .logseq-block-calendar .calendar-nav {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
    }
    .logseq-block-calendar .calendar-nav a {
      color: #999999;
    }
    .logseq-block-calendar .calendar-day-rec {
      position: relative;
    }
    .logseq-block-calendar .calendar-day-rec .dot-task-undone::after {
      content: "";
      display: block;
      background-color: ${logseq.settings?.taskUndoneDotColor};
      width: 4px;
      height: 4px;
      transform: rotate(45deg);
      position: absolute;
      right: calc(50% - 5px);
    }
    .logseq-block-calendar .calendar-day-rec .dot-task-done::after {
      content: "";
      display: block;
      background-color: ${logseq.settings?.taskDoneDotColor};
      width: 4px;
      height: 4px;
      transform: rotate(45deg);
      position: absolute;
      right: calc(50% - 5px);
    }
    .logseq-block-calendar .calendar-day-rec .dot-journal-with-task::after {
      content: "";
      display: block;
      background-color: ${logseq.settings?.journalDotColor};
      width: 4px;
      height: 4px;
      border-radius: 100%;
      position: absolute;
      left: calc(50% - 5px);
    }
    .logseq-block-calendar .calendar-day-rec .dot-journal-without-task::after {
      content: "";
      display: block;
      background-color: ${logseq.settings?.journalDotColor || "red"};
      width: 4px;
      height: 4px;
      margin: auto;
      border-radius: 100%;
    }
    #right-sidebar-container #block-calendar-widget_placeholder {
      padding: 6px 16px 6px 12px;
    }
    `,
  });
}
