import cron from "node-cron";
import { moveFundsAfterFiveDays } from "./job";
import { unreserveExpiredProducts } from "./unreserveProducts";


cron.schedule("0 2 * * *", async () => {
  await moveFundsAfterFiveDays(); // runs every day at 2AM
});

cron.schedule("*/5 * * * *", async () => {
  await unreserveExpiredProducts(); // runs every 5 minutes
});
