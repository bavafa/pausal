// Vercel Node function entry (Web Request/Response handlers).
import { handle } from "./handler.ts";

export const POST = handle;
export const OPTIONS = handle;
