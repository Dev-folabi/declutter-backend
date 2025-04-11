import cron from "node-cron";
import { moveFundsAfterFiveDays } from "./job";


cron.schedule("0 2 * * *", async () => {
  await moveFundsAfterFiveDays(); // runs every day at 2AM
});
