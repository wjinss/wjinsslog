import { create } from "zustand";
import { combine } from "zustand/middleware";

const INITIAL_STATE_SIGN_IN = {
  serverError: "",
};
const INITIAL_STATE_SIGN_UP = {
  serverMessage: "",
  isServerError: false,
};

export const useSignInForm = create(
  combine(INITIAL_STATE_SIGN_IN, (set) => ({
    setServerError: (message: string) =>
      set({
        serverError: message,
      }),
    clearServerError: () =>
      set({
        serverError: "",
      }),
  })),
);

export const useSignUpForm = create(
  combine(INITIAL_STATE_SIGN_UP, (set) => ({
    setServerFeedback: (message: string, isError: boolean) =>
      set({
        serverMessage: message,
        isServerError: isError,
      }),
    clearServerFeedback: () =>
      set({
        serverMessage: "",
        isServerError: false,
      }),
  })),
);
