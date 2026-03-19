export type UnsplashListPhoto = {
  id: string;
};

export type UnsplashPhoto = {
  id: string;
  description: string | null;
  alt_description: string | null;
  tags?: Array<{ title?: string | null }> | null;
  urls: {
    regular?: string;
    full?: string;
    raw?: string;
    small?: string;
  };
  user: {
    username: string;
    name?: string;
  };
};
