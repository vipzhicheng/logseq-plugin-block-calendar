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
  logseq.provideModel({
    async processJump(e: any) {
      console.log("e", e);
      const { type, value } = e.dataset;
      if (type === "day") {
        logseq.App.pushState("page", {
          name: value,
        });
      }
    },
  });
  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    const calendar = await setCal();
    const [type, uuid] = payload.arguments;
    console.log("type", type);
    console.log("uuid", uuid);

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
    #logseq-plugin-block-calendar--block-calendar .calendar-month-year {
      float: left;
    }
    #logseq-plugin-block-calendar--block-calendar .calendar-nav {
      float: right;
      font-size: 14px;
      font-weight: normal;
    }
    `,
  });
};

logseq.ready().then(main).catch(console.error);
