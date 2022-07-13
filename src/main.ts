import "@logseq/libs";
import { createApp } from "vue";
import App from "./App.vue";
import { setCal } from "./common/funcs";
import "./style.css";

function createModel() {
  return {
    openModal() {
      logseq.showMainUI();
    },
  };
}

async function triggerBlockModal() {
  createModel().openModal();
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
      const { year, month, slot } = e.dataset;
      if (year && month) {
        const year4 = Number(year);
        const month0 = Number(month) - 1;
        const calendar = await setCal(year4, month0, slot);
        logseq.provideUI({
          key: "block-calendar",
          slot,
          reset: true,
          template: calendar,
        });
      }
    },
  });
  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    let [type, year, month] = payload.arguments;

    const now = new Date();
    const year4 = year ? Number(year) : now.getFullYear();
    const month0 = month ? Number(month) - 1 : now.getMonth();

    const calendar = await setCal(year4, month0, slot);
    if (type === "block-calendar") {
      logseq.provideUI({
        key: "block-calendar",
        slot,
        reset: true,
        template: calendar,
        // template: `<a data-type="day" data-value="2022-06-02" data-on-click="processJump">2</a>`,
      });
    }
  });

  logseq.provideStyle({
    key: "block-calendar",
    style: `
    #logseq-plugin-block-calendar--block-calendar tr:nth-child(even) {
      background-color: transparent;
    }
    #logseq-plugin-block-calendar--block-calendar tr:nth-child(odd) {
      background-color: transparent;
    }
    #logseq-plugin-block-calendar--block-calendar th {
      border-bottom: 0;
      font-size: 20px;
      font-weight: bold;
      padding-left: 4px;
    }
    #logseq-plugin-block-calendar--block-calendar td {
      font-size: 14px;
      padding: 0;
      text-align: center;
    }

    #logseq-plugin-block-calendar--block-calendar .calendar-head {
      font-weight: bold;
      color: #999;
    }

    #logseq-plugin-block-calendar--block-calendar table {
      margin: 0;
    }

    #logseq-plugin-block-calendar--block-calendar a {
      color: #000;
    }


    #logseq-plugin-block-calendar--block-calendar .calendar-td-today {
      font-weight: bold;
      color: blue;
    }

    #logseq-plugin-block-calendar--block-calendar .calendar-nav {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
    }
    #logseq-plugin-block-calendar--block-calendar .calendar-nav a {
      color: #999;

    }
    `,
  });
};

logseq.ready().then(main).catch(console.error);
