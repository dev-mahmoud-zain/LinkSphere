export const generateOTP = (): string => {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
};