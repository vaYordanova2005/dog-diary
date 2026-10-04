import type { ActionResult } from "@/lib/actions";

export const GENERIC_ERROR = "Something went wrong. Reload the page and try again.";

// Runs a server action from a button/menu and shows the error in an alert, instead of
// breaking the whole page. Used only in client components.
export async function runAction(action: () => Promise<ActionResult | void>) {
  try {
    const result = await action();
    if (result?.error) window.alert(result.error);
  } catch (error) {
    console.error(error);
    window.alert(GENERIC_ERROR);
  }
}
