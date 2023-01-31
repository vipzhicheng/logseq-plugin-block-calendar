import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { setCal, provideStyle, languageMapping, getLang, clearCachedDays, print } from "./common/funcs";
import langs from "./lang";
import { logseq as logseqPackageSection } from "../package.json";


const defineSettings: SettingSchemaDesc[] = [
  {
    key: "enableDot",
    type: "boolean",
    title: "Enable dot",
    description:
      "Enable red dot, to show whether or not journal exists on that day. Need reload to take effect.",
    default: true,
  },
  {
    key: "journalDotColor",
    type: "string",
    title: "Journal dot color",
    description: "Journal dot color",
    default: "#0000ff",
    inputAs: "color",
  },
  {
    key: "taskUndoneDotColor",
    type: "string",
    title: "Undone task dot color",
    description: "Undone task dot color",
    default: "#ff18ff",
    inputAs: "color",
  },
  {
    key: "taskDoneDotColor",
    type: "string",
    title: "Done task dot color",
    description: "Done task dot color",
    default: "#03b803",
    inputAs: "color",
  },
  {
    key: "firstDayOfWeek",
    type: "enum",
    title: "First day of week",
    description:
      "Which day is the first day of your week? Need to trigger rerender manually to take effect.",
    enumChoices: ["monday", "sunday"],
    enumPicker: "radio",
    default: "sunday",
  },
  {
    key: "defaultLanguage",
    type: "enum",
    title: "Language locale",
    enumChoices: Object.keys(languageMapping),
    description: "",
    default: "en",
  },
  {
    key: "tableWidth",
    type: "string",
    title: "Calendar width",
    description: "Set calendar width, default is 100%.",
    default: "100%",
  },
  {
    key: "alwaysRenderIn",
    type: "string",
    title: "",
    description:
      "Always render calendar in custom HTML element (provide CSS selector: ID or class), Leave empty to disable and input .sidebar-item-list to render calendar at right top in sidebar.",
    default: ".sidebar-item-list",
  },
  {
    key: "yearlyColumns",
    type: "enum",
    enumChoices: ["2", "3", "4"],
    title: "",
    description: "Choose how many columns in yearly view",
    default: "3",
  },
];

logseq.useSettingsSchema(defineSettings);
logseq.onSettingsChanged(() => {
  provideStyle();
});

logseq.App.onGraphAfterIndexed(() => {
  clearCachedDays();
});
logseq.App.onCurrentGraphChanged(() => {
  clearCachedDays();
});


const calendarKeyPrefix = "block-calendar-";

const calendarWidgetSlot = "widget";
const calendarWidgetKey = calendarKeyPrefix + calendarWidgetSlot;
const calendarWidgetPlaceholder = `#${calendarWidgetKey}_placeholder`;


function provideCalendarUI(calendar: string, slot: string) {
  if (!slot) {
    throw new Error("Attemp to render without slot");
  }
  
  const params = {
    reset: true,
    template: calendar,
  };

  if (slot === calendarWidgetSlot) {
    params.key = calendarWidgetKey;
    params.path = calendarWidgetPlaceholder;
  } else {
    params.key = calendarKeyPrefix + slot;
    params.slot = slot;
  }

  logseq.provideUI(params);
}


const main = async () => {
  logseq.Editor.registerSlashCommand("Insert Block Calendar", async () => {
    await logseq.Editor.insertAtEditingCursor(`{{renderer block-calendar}} `);
  });

  logseq.provideModel({
    async processJump(e: any) {
      const { type, value } = e.dataset;
      if (type === "day") {
        logseq.App.pushState("page", {
          name: value,
        });
      }
    },

    async loadCalendar(e: any) {
      const { year, month, slot, language, options } = e.dataset;

      if (year && month) {
        const year4 = Number(year);
        const month0 = Number(month) - 1;

        const calendar = await setCal(year4, month0, slot, language, options.split(" "));
        provideCalendarUI(calendar, slot);
      }
    },

    async loadCalendarYearly(e: any) {
      let { year, slot, language, options } = e.dataset;
      if (year) {
        language = language || logseq.settings?.defaultLanguage;
        const lang = getLang(language);
        const now = new Date();
        const year4 = year ? Number(year) : now.getFullYear();
        let monthView = "";
        for (let month0 of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
          const calendar = await setCal(year4, month0, slot, language, [
            "nonav",
            "noyear",
          ]);
          monthView += calendar;
        }
        const header = `<div class="header"><span class="calendar-title">${year4}</span><div class="controls">
      <a class="button inline-button no-padding-button" data-year="${
        year4 - 1
      }" data-slot="${slot}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump to previous year."><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="15 6 9 12 15 18" />
    </svg></a> <a class="button inline-button padding-button" data-year="${now.getFullYear()}" data-slot="${slot}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump back to current year.">${
          lang.Today
        }</a> <a class="button inline-button no-padding-button" data-year="${
          year4 + 1
        }" data-slot="${slot}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump to next year"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="9 6 15 12 9 18" />
    </svg></a>
      </div></div>`;

        const template = `${header}<div class="yearly-months">${monthView}</div>`;

        logseq.provideUI({
          key: "block-calendar-yearly-" + slot,
          slot: slot,
          reset: true,
          template: template,
        });
      }
    },
  });

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    let [type] = payload.arguments;
    if (type === "block-calendar") {
      let [_, year, month, language, ...options] = payload.arguments;
      const now = new Date();
      const year4 = year ? Number(year) : now.getFullYear();
      const month0 = month ? Number(month) - 1 : now.getMonth();

      const calendar = await setCal(year4, month0, slot, language, options);
      provideCalendarUI(calendar, slot);
    } else if (type === "block-calendar-yearly") {
      let [_, year, language] = payload.arguments;
      const lang = getLang(language);
      const now = new Date();
      const year4 = year ? Number(year) : now.getFullYear();
      let monthView = "";
      for (let month0 of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
        const calendar = await setCal(year4, month0, slot, language, [
          "nonav",
          "noyear",
        ]);
        monthView += calendar;
      }
      const header = `<div class="header"><span class="calendar-title">${year4}</span><div class="controls">
      <a class="button inline-button no-padding-button" data-year="${
        year4 - 1
      }" data-slot="${slot}" data-on-click="loadCalendarYearly" title="Jump to previous year."><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="15 6 9 12 15 18" />
    </svg></a> <a class="button inline-button padding-button" data-year="${now.getFullYear()}" data-slot="${slot}" data-on-click="loadCalendarYearly" title="Jump back to current year.">${
        lang.Today
      }</a> <a class="button inline-button no-padding-button" data-year="${
        year4 + 1
      }" data-slot="${slot}" data-on-click="loadCalendarYearly" title="Jump to next year"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <polyline points="9 6 15 12 9 18" />
    </svg></a>
      </div></div>`;

      const template = `${header}<div class="yearly-months">${monthView}</div>`;

      logseq.provideUI({
        key: "block-calendar-yearly-" + slot,
        slot: slot,
        reset: true,
        template: template,
      });
    }
  });

  const renderAlwaysIn = async (containerSelector: string, recreate: boolean = false) => {
    let widgetPlaceholder = top?.document.querySelector(`${calendarWidgetPlaceholder}`) as HTMLElement;

    const remove = (widgetPlaceholder) => {
      if (!widgetPlaceholder) {
        return;
      }
      
      print("Remove widget placeholder");

      widgetPlaceholder.style.display = "none";
      widgetPlaceholder.remove();
      widgetPlaceholder = null;
    };

    if (!containerSelector) {
      remove(widgetPlaceholder);
      return;
    }
    
    const container = top?.document.querySelector(containerSelector) as HTMLElement;
    if (!container) {
      remove(widgetPlaceholder);
      return;
    }

    if (!widgetPlaceholder || recreate) {
      remove(widgetPlaceholder);
      print("Create new widget placeholder");

      widgetPlaceholder = top!.document.createElement("div");
      widgetPlaceholder.id = calendarWidgetPlaceholder.slice(1);
      container.insertAdjacentElement("afterbegin", widgetPlaceholder);
    }
    widgetPlaceholder.style.display = "block";

    const now = new Date();
    const calendar = await setCal(
      now.getFullYear(),
      now.getMonth(),
      calendarWidgetSlot,
      logseq.settings?.defaultLanguage,
      []
    );
    provideCalendarUI(calendar, calendarWidgetSlot);
  };

  setTimeout(async () => {
    await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
  }, 1000);

  logseq.App.onGraphAfterIndexed(() => {
    setTimeout(async () => {
      await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
    }, 1000);
  });

  logseq.App.onCurrentGraphChanged(() => {
    setTimeout(async () => {
      await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
    }, 1000);
  });

  logseq.App.onSidebarVisibleChanged(async (e) => {
    if (e.visible) {
      await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
    }
  });

  logseq.onSettingsChanged(async (newSettings: any, oldSettings: any) => {
    if (newSettings.alwaysRenderIn !== oldSettings.alwaysRenderIn) {
      await renderAlwaysIn(newSettings.alwaysRenderIn, true);
    }
  });

  logseq.DB.onChanged(async ({blocks, txData, txMeta}) => {
    for (const block of blocks) {
      if (block.journalDay) {
        await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
        return;
      }
    }
  });

  provideStyle();
};

logseq.ready().then(main).catch(console.error);
