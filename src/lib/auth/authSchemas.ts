import * as Yup from "yup";
import { fa } from "@/lib/i18n/fa";
import { isValidIranMobile } from "./phone";

const v = fa.auth.validation;

const phoneField = Yup.string()
  .trim()
  .required(v.phoneRequired)
  .test("iran-mobile", v.phoneInvalid, (value) => isValidIranMobile(value ?? ""));

export const loginValidationSchema = Yup.object({
  phone: phoneField,
  password: Yup.string().required(v.passwordRequired),
});

export const registerValidationSchema = Yup.object({
  name: Yup.string().trim().required(v.nameRequired),
  phone: phoneField,
  password: Yup.string().required(v.passwordRequired).min(6, v.passwordMin),
  passwordConfirm: Yup.string()
    .required(v.passwordConfirmRequired)
    .oneOf([Yup.ref("password")], v.passwordMismatch),
});

export const forgotRequestValidationSchema = Yup.object({
  phone: phoneField,
});

export const forgotResetValidationSchema = Yup.object({
  token: Yup.string().trim().required(v.tokenRequired),
  newPassword: Yup.string().required(v.passwordRequired).min(6, v.passwordMin),
});
