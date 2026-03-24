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
};
