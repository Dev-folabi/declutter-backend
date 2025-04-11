import dotenv from "dotenv";

dotenv.config();

export type Environment = "local" | "staging" | "production";

export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || "local";
};
