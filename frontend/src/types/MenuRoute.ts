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
  work: {title: 'Film', route: '/film', order: 1},
  reel: {title: 'Reel', route: '/reel', order: 2},
  photo: {title: 'Photo', route: '/photo', order: 3},
  contact: {title: 'Contact', route: '/contact', order: 4},
} as const;

export type MenuRoute = keyof typeof MenuRoute
