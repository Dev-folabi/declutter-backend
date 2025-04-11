import cron from "node-cron";
import { moveFundsAfterFiveDays } from "./job";


cron.schedule("* * * * *", async () => {
  await moveFundsAfterFiveDays(); // runs every day at 2AM
});
