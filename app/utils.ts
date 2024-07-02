import { Lifestyle } from "@prisma/client";

export const formatPathName = (name: string) =>
  name === "None" ? "No Path" : name;

export type PostgresInterval = "month" | "week";

export const formatLifestyle = (lifestyle: Lifestyle, shorten = false) => {
  switch (lifestyle) {
    case "HARDCORE":
      return shorten ? "HC" : "Hardcore";
    case "SOFTCORE":
      return shorten ? "SC" : "Softcore";
    case "CASUAL":
      return shorten ? "C" : "Casual";
  }
};
