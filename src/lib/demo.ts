// Demo mode: visitors sign in with one click, without a password.
// It is OFF unless DEMO_MODE="true" is set on the server, and it only ever works
// for the two accounts below — never for any other user.
export const DEMO_USERNAMES = ["doctor", "intern"];

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
