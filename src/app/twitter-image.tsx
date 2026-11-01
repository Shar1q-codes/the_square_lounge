import OpengraphImage from "./opengraph-image";
import { site } from "@/config/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same card as Open Graph. */
export default OpengraphImage;
