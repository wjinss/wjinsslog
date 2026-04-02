import { create } from "zustand";
import { combine } from "zustand/middleware";

type FormFeedbackStatus = "idle" | "success" | "error";

interface FormFeedbackState {
  status: FormFeedbackStatus;
  message: string;
}

const INITIAL_FORM_FEEDBACK = (): FormFeedbackState => ({
  status: "idle",
  message: "",
});

export const useSignInForm = create(
  combine(INITIAL_FORM_FEEDBACK(), (set) => ({
    setFeedback: (status: FormFeedbackStatus, message: string) =>
      set({
        status,
        message,
      }),
    clearFeedback: () => set(INITIAL_FORM_FEEDBACK()),
  })),
);

export const useSignUpForm = create(
  combine(INITIAL_FORM_FEEDBACK(), (set) => ({
    setFeedback: (status: FormFeedbackStatus, message: string) =>
      set({
        status,
        message,
      }),
    clearFeedback: () => set(INITIAL_FORM_FEEDBACK()),
  })),
);
