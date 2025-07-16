export interface MenuRouteObj {
  title: string;
  route: string;
}

export interface MenuRouteType {
  [route: string]: MenuRouteObj
}

export const MenuRoute: MenuRouteType = {
  home: {title: 'Home', route: '/'},
  reel: {title: 'Reel', route: '/reel'},
  work: {title: 'Work', route: '/work'},
  about: {title: 'About', route: '/about'},
} as const;

export type MenuRoute = keyof typeof MenuRoute
