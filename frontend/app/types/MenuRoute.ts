export interface MenuRouteObj {
  title: string;
  route: string;
  order: number;
}

export interface MenuRouteType {
  [route: string]: MenuRouteObj
}

export const MenuRoute: MenuRouteType = {
  home: {title: 'Home', route: '/', order: 0},
  work: {title: 'Work', route: '/work', order: 1},
  reel: {title: 'Reel', route: '/reel', order: 2},
  about: {title: 'About', route: '/about', order: 3},
} as const;

export type MenuRoute = keyof typeof MenuRoute
