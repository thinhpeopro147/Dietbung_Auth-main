export const getDirectKey = (userIdA, userIdB) => {
  return [userIdA.toString(), userIdB.toString()].sort().join("_");
};
