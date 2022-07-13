import "@logseq/libs";
import { format } from "date-fns";

import langs from "../lang";
// ref: http://www.javascriptkit.com/script/cut20.shtml
function getTime() {
  // initialize time-related variables with current time settings
  let now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let ampm = "";

  // validate hour values and set value of ampm
  if (hour >= 12) {
    hour -= 12;
    ampm = "PM";
  } else ampm = "AM";
  hour = hour == 0 ? 12 : hour;

  // add zero digit to a one digit minute
  if (minute < 10) minute = Number("0" + minute); // do not parse this number!

  // return time string
  return hour + ":" + minute + " " + ampm;
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
  var ar = new Array(12);
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

async function getMonthName(month: number) {
  const lang = await getLang();
  // create array to hold name of each month
  var ar = new Array(12);
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

export async function setCal(year4: number, month0: number, slot: string) {
  // standard time attributes
  const now = new Date();
  const monthName = await getMonthName(month0);
  const date = now.getDate();

  // create instance of first day of month, and extract the day on which it occurs
  const firstDayInstance = new Date(year4, month0, 1);
  const firstDay = firstDayInstance.getDay();

  // number of days in current month
  var days = getDays(month0, year4);

  // call function to draw calendar
  return await drawCal(
    firstDay + 1,
    days,
    date,
    month0,
    monthName,
    year4,
    slot
  );
}

const getLang = async () => {
  const config = await logseq.App.getUserConfigs();

  type Lang = keyof typeof langs;
  const lang: Lang = (
    ["zh-CN"].includes(config.preferredLanguage)
      ? config.preferredLanguage
      : "en"
  ) as Lang;

  return langs[lang];
};

export async function drawCal(
  firstDay: number,
  lastDate: number,
  date: number,
  month: number,
  monthName: string,
  year: number,
  slot: string
) {
  const now = new Date();
  const lang = await getLang();
  const config = await logseq.App.getUserConfigs();

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
  var text = ""; // initialize accumulative variable to empty string
  text += "<TABLE>"; // table settings
  text += '<TH COLSPAN=5 class="calendar-title">'; // create table header cell
  text += `<strong class="calendar-month">${monthName}</strong> <strong class="calendar-year">${year}</strong>`;
  text += '</TH><th COLSPAN=2 class="calendar-nav">'; // close header cell

  text += `<a class="" data-year="${previousMonthYear}" data-month="${
    previousMonth + 1
  }" data-slot="${slot}" data-on-click="loadCalendar" title="Jump to previous month.">&lt;</a> <a class="" data-year="${now.getFullYear()}" data-month="${
    now.getMonth() + 1
  }" data-slot="${slot}" data-on-click="loadCalendar" title="Jump back to current month.">Today</a> <a class="" data-year="${nextMonthYear}" data-month="${
    nextMonth + 1
  }" data-slot="${slot}" data-on-click="loadCalendar" title="Jump to next month">&gt;</a>`;
  text += "</th>";

  // variables to hold constant settings
  var openCol = "<TD>";
  var closeCol = "</TD>";

  // create array of abbreviated day names
  var weekDay = new Array(7);

  const firstDayOfWeek = "monday";

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
  text += '<TR class="calendar-head" ALIGN="center" VALIGN="center">';
  for (var dayNum = 0; dayNum < 7; ++dayNum) {
    text += openCol + weekDay[dayNum] + closeCol;
  }
  text += "</TR>";

  // declaration and initialization of two variables to help with tables
  var digit = 1;
  var curCell = 1;

  for (var row = 1; row <= Math.ceil((lastDate + firstDay - 1) / 7); ++row) {
    text += '<TR ALIGN="center" VALIGN="top">';
    for (var col = 1; col <= 7; ++col) {
      if (digit > lastDate) break;

      // @ts-ignore
      if (curCell < (firstDayOfWeek === "sunday" ? firstDay : firstDay - 1)) {
        text += "<TD></TD>";
        curCell++;
      } else {
        const journalTitle = format(
          new Date(`${year}-${month + 1}-${digit}`),
          config.preferredDateFormat
        );
        text +=
          "<TD>" +
          `<a class="button ${
            date === digit &&
            year === now.getFullYear() &&
            month === now.getMonth()
              ? "calendar-td-today"
              : ""
          }" data-type="day" data-value="${journalTitle}" data-on-click="processJump">${digit}</a>` +
          "</TD>";
        digit++;
      }
    }
    text += "</TR>";
  }

  // close all basic table tags
  text += "</TABLE>";

  return text;
}
