import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("pages/home.tsx"),
    route("reel", "pages/reel.tsx"),
    route("work", "pages/work.tsx"),
    route("about", "pages/about.tsx"),
] satisfies RouteConfig;

