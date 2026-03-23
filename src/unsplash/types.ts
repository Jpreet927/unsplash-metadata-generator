export type UnsplashListPhoto = {
  id: string;
};

export type UnsplashPhoto = {
  id: string;
  description: string | null;
  tags: Array<{ title?: string | null }>;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user?: {
    username: string;
    name: string;
  };
};
