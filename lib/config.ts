export const TEAM_CONFIG = {
  red: {
    id: "red",
    name: "TEAM RED",
    emoji: "🔴",
    color: "#C0392B",
    code: "WEALTH",
    members: [
      "Aarav Mehta",
      "Riya Shah",
      "Kabir Joshi",
      "Anaya Rao",
      "Vivaan Patil",
      "Kiara Deshmukh",
      "Arjun Kulkarni",
      "Myra Kapoor",
      "Rohan Singh",
    ],
  },
  blue: {
    id: "blue",
    name: "TEAM BLUE",
    emoji: "🔵",
    color: "#2874A6",
    code: "EKVITY",
    members: [
      "Advait Nair",
      "Sana Khan",
      "Rohan Bhat",
      "Tara Shah",
      "Reyansh More",
      "Isha Jain",
      "Neil Verma",
      "Meera Rao",
    ],
  },
  yellow: {
    id: "yellow",
    name: "TEAM YELLOW",
    emoji: "🟡",
    color: "#B7950B",
    code: "GROWTH",
    members: [
      "Vihaan Joshi",
      "Aditi Mehta",
      "Yash Shah",
      "Siya Kulkarni",
      "Atharv Patil",
      "Naina Deshmukh",
      "Dhruv Nair",
      "Ira Kapoor",
    ],
  },
  green: {
    id: "green",
    name: "TEAM GREEN",
    emoji: "🟢",
    color: "#1E8449",
    code: "AHEAD",
    members: [
      "Reyansh Patil",
      "Anika Joshi",
      "Aditya Mehta",
      "Kavya Rao",
      "Rudra Shah",
      "Sara Khan",
      "Arnav Verma",
      "Kiara Nair",
    ],
  },
} as const;

export type TeamId = keyof typeof TEAM_CONFIG;
export const TEAMS = Object.values(TEAM_CONFIG);

// Card chances awarded per game when team beats the clock
export const CARD_CHANCES_PER_GAME: Record<string, number> = {
  mirchi: 2,
  jal: 2,
};

// Max cards a team can open total across all games
export const MAX_CARD_OPENS = 4;