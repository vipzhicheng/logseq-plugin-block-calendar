import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { setCal, provideStyle, languageMapping } from "./common/funcs";
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
  });

  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    let [type, year, month, lang, ...options] = payload.arguments;
    if (type === "block-calendar") {
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
    }
  });

  const renderAlwaysIn = async (containerSelector: string, forceCreateNew: boolean = false) => {
    const calendarPlaceholderId = "calendar-placeholder";
    const calendarPlaceholder = top?.document.querySelector(`#${calendarPlaceholderId}`) as HTMLElement;

    if (calendarPlaceholder && !forceCreateNew) {
      // update existed widget in `calendarPlaceholderId`

      calendarPlaceholder.style.display = "none";

      logseq.provideUI({
        key: "calendar-widget",
        path: `#${calendarPlaceholderId}`,
        reset: true,
        template: "",
      });

      return; // no need to create new widget
    }
    
    
    // create new calendar widget in `containerSelector`
    
    if (calendarPlaceholder) {
      calendarPlaceholder.style.display = "none";
      calendarPlaceholder.remove();
    }
    
    if (!containerSelector) {
      return;
    }

    const container = top?.document.querySelector(containerSelector) as HTMLElement;
    if (!container) {
      return;
    }
   
    const calendarNewPlaceholder = top!.document.createElement("div");
    calendarNewPlaceholder.id = calendarPlaceholderId;
    calendarNewPlaceholder.style.display = "block";
    container.insertAdjacentElement("afterbegin", calendarNewPlaceholder);

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
      await renderAlwaysIn(newSettings.alwaysRenderIn, true);
    }
  });

  provideStyle();
};

logseq.ready().then(main).catch(console.error);
