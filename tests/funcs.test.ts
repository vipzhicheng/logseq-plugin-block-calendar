import { AppUserConfigs } from "@logseq/libs/dist/LSPlugin.user";
import { setCal } from "../src/common/funcs";

type DateTestCase = {
  year: number;
  monthIndex: number;
};

const testCases: DateTestCase[] = [
  { year: 2021, monthIndex: 0 },
  { year: 2021, monthIndex: 1 },
  { year: 2021, monthIndex: 6 },
  { year: 2021, monthIndex: 7 },
  { year: 2021, monthIndex: 10 },
  { year: 2021, monthIndex: 11 },
  // // Leap year divisible by 4 but not by 100.
  { year: 2024, monthIndex: 0 },
  { year: 2024, monthIndex: 1 },
  { year: 2024, monthIndex: 6 },
  { year: 2024, monthIndex: 7 },
  { year: 2024, monthIndex: 10 },
  { year: 2024, monthIndex: 11 },
  // // Leap year divisible by 4, 100 and 400.
  { year: 2000, monthIndex: 0 },
  { year: 2000, monthIndex: 1 },
  { year: 2000, monthIndex: 6 },
  { year: 2000, monthIndex: 7 },
  { year: 2000, monthIndex: 10 },
  { year: 2000, monthIndex: 11 },
  // // Contrary to popular belief, 1900 was not a leap year as it is not divisible by 400
  { year: 1900, monthIndex: 0 },
  { year: 1900, monthIndex: 1 },
  { year: 1900, monthIndex: 6 },
  { year: 1900, monthIndex: 7 },
  { year: 1900, monthIndex: 10 },
  { year: 1900, monthIndex: 11 },
];

const TEST_SLOT = "anywhere";
const TEST_LOCALE = "en";
const TEST_NOW = new Date("2023-10-22");

const mockConfig: AppUserConfigs = {
  preferredThemeMode: "dark",
  preferredFormat: 'markdown',
  preferredDateFormat: "do MMMM yyyy",
  preferredStartOfWeek: "Monday",
  preferredLanguage: TEST_LOCALE,
  preferredWorkflow: "TODO/DOING",
  currentGraph: "test",
  showBracket: false,
  enabledFlashcards: false,
  enabledJournals: false,
};

describe("Given the setCal function", () => {
  const realConfig = logseq.App.getUserConfigs;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(TEST_NOW);
    logseq.App.getUserConfigs = jest.fn().mockResolvedValue(mockConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    logseq.App.getUserConfigs = realConfig;
  });

  describe.each(testCases)("When it receives the year $year and month $monthIndex", ({ year, monthIndex }) => {
    it("should return a calendar object", async () => {
      await expect(setCal(year, monthIndex, TEST_SLOT, TEST_LOCALE, [])).resolves.toMatchSnapshot();
    });

    if (monthIndex === 1) {
      it("should return a calendar object with the correct amount of days for February", async () => {
        const cal = await setCal(year, monthIndex, TEST_SLOT, TEST_LOCALE, []);
        if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
          expect(cal).toContain("29th February");
        } else {
          expect(cal).not.toContain("29th February");
        }
      })
    }

  });
  /*
  export async function setCal(
year4: number,
month0: number,
slot: string,
language: string = "",
options: string[] = []
) {
*/
});