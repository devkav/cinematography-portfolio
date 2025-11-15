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
  work: {title: 'Video', route: '/video', order: 1},
  photo: {title: 'Photo', route: '/photo', order: 2},
  reel: {title: 'Reel', route: '/reel', order: 3},
  contact: {title: 'Contact', route: '/contact', order: 4},
} as const;

export type MenuRoute = keyof typeof MenuRoute
