import "@logseq/libs";
import { createApp } from "vue";
import App from "./App.vue";
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
    const [type, uuid] = payload.arguments;
    console.log("type", type);
    console.log("uuid", uuid);

    if (type === "block-calendar") {
      logseq.provideUI({
        key: "block-calendar",
        slot,
        reset: true,
        template: `<a data-type="day" data-value="2022-06-02" data-on-click="processJump">2</a>`,
      });
    }
  });
};

logseq.ready().then(main).catch(console.error);
