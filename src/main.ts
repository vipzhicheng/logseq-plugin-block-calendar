import "@logseq/libs";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { setCal, provideStyle } from "./common/funcs";

const defineSettings: SettingSchemaDesc[] = [
  {
    key: "enableDot",
    type: "boolean",
    title: "Enable dot",
    description:
      "Enable red dot, to show weather or not journal exist on that day. Need reload to take effect.",
    default: true,
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
    type: "string",
    title: "Language locale",
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
      "Always render calendar always in custom HTML element (provide CSS selector: ID or class)",
    default: "#banner-widget-calendar",
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

  if (logseq.settings?.alwaysRenderIn) {
    const now = new Date();
    const calendar = await setCal(
      now.getFullYear(),
      now.getMonth(),
      logseq.settings.alwaysRenderIn.substring(1),
      logseq.settings?.defaultLanguage,
      []
    );
    logseq.provideUI({
      key: "calendar-widget",
      path: logseq.settings.alwaysRenderIn,
      reset: true,
      template: calendar,
    });
  }

  provideStyle();

};

logseq.ready().then(main).catch(console.error);
