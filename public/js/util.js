export const html = (strings, ...subs) => {
  return String.raw({ raw: strings }, ...subs);
};
