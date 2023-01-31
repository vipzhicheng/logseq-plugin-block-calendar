import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { setCal, provideStyle, languageMapping, getLang } from "./common/funcs";
import langs from "./lang";

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

const main = async () => {
  logseq.Editor.registerSlashCommand("Insert Block Calendar", async () => {
    await logseq.Editor.insertAtEditingCursor(`{{renderer block-calendar}} `);
  });

  logseq.provideModel({
    async editBlock(e: any) {
      const { uuid } = e.dataset;
      await logseq.Editor.editBlock(uuid);
    },

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
        const calendar = await setCal(
          year4,
          month0,
          slot,
          language,
          options.split(" ")
        );
        logseq.provideUI({
          key: "block-calendar-" + slot,
          slot,
          reset: true,
          template: calendar,
        });
      }
    },

    async loadCalendarYearly(e: any) {
      let { year, slot, language, uuid, options } = e.dataset;
      options = options.split(" ");
      if (year) {
        language =
          language || languageMapping[logseq.settings?.defaultLanguage || "en"];
        const lang = await getLang(language);
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
        let header = `<div class="header"><span class="calendar-title">${year4}</span><div class="controls">
        <a class="button inline-button no-padding-button" data-uuid="${uuid}" data-on-click="editBlock"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4" />
          <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
        </svg></a>`;

        if (!options.includes("nonav")) {
          header += `
        <a class="button inline-button no-padding-button" data-year="${
          year4 - 1
        }" data-slot="${slot}" data-uuid="${uuid}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump to previous year."><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="15 6 9 12 15 18" />
      </svg></a> <a class="button inline-button padding-button" data-year="${now.getFullYear()}" data-slot="${slot}" data-uuid="${uuid}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump back to current year.">${
            lang.Today
          }</a> <a class="button inline-button no-padding-button" data-year="${
            year4 + 1
          }" data-slot="${slot}" data-uuid="${uuid}" data-language="${language}" data-on-click="loadCalendarYearly" title="Jump to next year"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="9 6 15 12 9 18" />
      </svg></a>
        `;
        }

        header += "</div></div>";

        const template = `${
          !options.includes("nohead") ? header : ""
        }<div class="yearly-months">${monthView}</div>`;

        logseq.provideUI({
          key: "block-calendar-yearly-" + slot,
          slot,
          reset: true,
          template: template,
        });
      }
    },
  });

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    let [type] = payload.arguments;
    const uuid = payload.uuid;
    if (type === "block-calendar") {
      let [_, year, month, lang, ...options] = payload.arguments;
      const now = new Date();
      const year4 = year ? Number(year) : now.getFullYear();
      const month0 = month ? Number(month) - 1 : now.getMonth();

      const calendar = await setCal(year4, month0, slot, lang, options);
      logseq.provideUI({
        key: "block-calendar-" + slot,
        slot,
        reset: true,
        template: calendar,
      });
    } else if (type === "block-calendar-yearly") {
      let [_, year, language, ...options] = payload.arguments;
      language =
        language || languageMapping[logseq.settings?.defaultLanguage || "en"];
      const lang = await getLang(language);
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
      let header = `<div class="header"><span class="calendar-title">${year4}</span><div class="controls">
      <a class="button inline-button no-padding-button" data-uuid="${uuid}" data-on-click="editBlock"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4" />
          <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
        </svg></a>`;

      if (!options.includes("nonav")) {
        header += `
        <a class="button inline-button no-padding-button" data-year="${
          year4 - 1
        }" data-language="${language}" data-slot="${slot}" data-uuid="${uuid}" data-on-click="loadCalendarYearly" data-options="${options.join(
          " "
        )}" data-options="${options.join(
          " "
        )}" title="Jump to previous year."><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="15 6 9 12 15 18" />
      </svg></a> <a class="button inline-button padding-button" data-year="${now.getFullYear()}" data-language="${language}" data-slot="${slot}" data-uuid="${uuid}" data-on-click="loadCalendarYearly" data-options="${options.join(
          " "
        )}" data-options="${options.join(
          " "
        )}" title="Jump back to current year.">${
          lang.Today
        }</a> <a class="button inline-button no-padding-button" data-year="${
          year4 + 1
        }" data-language="${language}" data-slot="${slot}" data-uuid="${uuid}" data-on-click="loadCalendarYearly" data-options="${options.join(
          " "
        )}" data-options="${options.join(
          " "
        )}" title="Jump to next year"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right inline-block" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="9 6 15 12 9 18" />
      </svg></a>
       `;
      }

      header += "</div></div>";

      const template = `${
        !options.includes("nohead") ? header : ""
      }<div class="yearly-months">${monthView}</div>`;

      logseq.provideUI({
        key: "block-calendar-yearly-" + slot,
        slot,
        reset: true,
        template: template,
      });
    }
  });

  const renderAlwaysIn = async (containerSelector: string) => {
    const config = await logseq.App.getUserConfigs();
    const calendarPlaceholderId = "calendar-placeholder";

    if (containerSelector && config.enabledJournals) {
      const container = top?.document.querySelector(
        containerSelector
      ) as HTMLElement;
      const placeholderExist = top?.document.querySelector(
        `#${calendarPlaceholderId}`
      ) as HTMLElement;
      if (placeholderExist) {
        placeholderExist.style.display = "block";
      }
      if (container && !placeholderExist) {
        const calendarPlaceholder = top!.document.createElement("div");
        calendarPlaceholder.id = calendarPlaceholderId;
        calendarPlaceholder.style.display = "block";
        container.insertAdjacentElement("afterbegin", calendarPlaceholder);
      }

      const now = new Date();
      const calendar = await setCal(
        now.getFullYear(),
        now.getMonth(),
        calendarPlaceholderId,
        logseq.settings?.defaultLanguage,
        []
      );
      logseq.provideUI({
        key: "calendar-widget",
        path: `#${calendarPlaceholderId}`,
        reset: true,
        template: calendar,
      });
    } else {
      const placeholderExist = top?.document.querySelector(
        `#${calendarPlaceholderId}`
      ) as HTMLElement;
      if (placeholderExist) {
        placeholderExist.style.display = "none";
      }
      if (placeholderExist) {
        logseq.provideUI({
          key: "calendar-widget",
          path: `#${calendarPlaceholderId}`,
          reset: true,
          template: "",
        });
      }
    }
  };

  setTimeout(async () => {
    await renderAlwaysIn(logseq.settings?.alwaysRenderIn);
  }, 1000);
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
      await renderAlwaysIn(newSettings.alwaysRenderIn);
    }
  });

  provideStyle();
};

logseq.ready().then(main).catch(console.error);
