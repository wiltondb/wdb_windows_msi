export default () => {
  const uuid = crypto.randomUUID();
  return "_" + uuid.replace(/-/g, "_");
};
