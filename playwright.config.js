/** @type {import('@playwright/test').PlaywrightTestConfig} */
export const testDir = "./tests";
export const reporter = [["html", { open: "never" }], ["list"]];
export const timeout = 120000;