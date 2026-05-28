"use client";

import { useMemo, useState } from "react";
import { UserRound, MapPin, IdCard } from "@/components/icons";
import { formatIranPhoneDisplay } from "@/lib/auth/phone";
import { toEnglishDigits } from "@/lib/persian-digits";
import { Button } from "@/components/ui/Button";
import type { AccountProfilePayload } from "@/lib/hooks/useAccount";
import { DatePickerBox, SelectBox, TextAreaBox, TextBox } from "@/components/inputs";
import { iconSizes, ICON_VARIANT, type IconComponent } from "@/lib/icons";
import { STONE_OPTIONS } from "@/lib/constants";
import { styleFilterOptions, budgetFilterOptions } from "@/lib/shop-filter-utils";

type AccountUser = {
  name: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  postalCode?: string | null;
  addressLine?: string | null;
  province?: string | null;
  city?: string | null;
  nationalCode?: string | null;
  landlinePhone?: string | null;
  gender?: "male" | "female" | "other" | null;
  favoriteStone?: string | null;
  favoriteStyle?: string | null;
  favoriteBudgetBand?: string | null;
};

function ProfileFieldGroup({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="account-profile-group">
      <legend className="account-profile-group-legend">
        {Icon ? (
          <span className="account-profile-group-icon" aria-hidden>
            <Icon size={iconSizes.sm} variant={ICON_VARIANT} />
          </span>
        ) : null}
        <span>
          <span className="account-profile-group-title">{title}</span>
          {description ? <span className="account-profile-group-desc">{description}</span> : null}
        </span>
      </legend>
      <div className="account-profile-fields [&_.field-control]:w-full">{children}</div>
    </fieldset>
  );
}

export function AccountProfileForm({
  user,
  isSaving,
  onSave,
}: {
  user: AccountUser;
  isSaving: boolean;
  onSave: (payload: AccountProfilePayload) => Promise<boolean>;
}) {
  const [form, setForm] = useState<AccountProfilePayload>({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
    postalCode: user.postalCode ?? "",
    addressLine: user.addressLine ?? "",
    province: user.province ?? "",
    city: user.city ?? "",
    nationalCode: user.nationalCode ?? "",
    landlinePhone: user.landlinePhone ?? "",
    gender: user.gender ?? "",
    favoriteStone: user.favoriteStone ?? "",
    favoriteStyle: user.favoriteStyle ?? "",
    favoriteBudgetBand: user.favoriteBudgetBand ?? "",
  });

  const canSave = useMemo(
    () => Boolean(form.firstName.trim() && form.lastName.trim()),
    [form.firstName, form.lastName]
  );

  const setField = (key: keyof AccountProfilePayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeDigits = (value: string) => toEnglishDigits(value).replace(/[^\d]/g, "");

  return (
    <div className="account-profile">
      <div className="account-profile-intro">
        <p className="account-profile-intro-title">پروفایل شما</p>
        <p className="account-profile-intro-desc">
          اطلاعات زیر برای صدور فاکتور، ارسال سفارش و هماهنگی با پشتیبانی استفاده می‌شود.
        </p>
      </div>

      <ProfileFieldGroup title="هویت" description="نام و مشخصات فردی" icon={UserRound}>
        <TextBox
          label="نام"
          value={form.firstName}
          onChange={(e) => setField("firstName", e.target.value)}
          placeholder="مثلاً علی"
        />
        <TextBox
          label="نام خانوادگی"
          value={form.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          placeholder="مثلاً رضایی"
        />
        <DatePickerBox
          label="تاریخ تولد"
          value={form.birthDate}
          onValueChange={(val) => setField("birthDate", val)}
        />
        <SelectBox
          label="جنسیت"
          value={form.gender}
          onValueChange={(value) => setField("gender", value)}
          options={[
            { value: "", label: "انتخاب نشده" },
            { value: "male", label: "آقا" },
            { value: "female", label: "خانم" },
            { value: "other", label: "سایر" },
          ]}
        />
      </ProfileFieldGroup>

      <ProfileFieldGroup
        title="پروفایل سلیقه"
        description="برای پیشنهادهای شخصی‌سازی‌شده در خانه و فروشگاه"
        icon={UserRound}
      >
        <SelectBox
          label="سنگ محبوب"
          value={form.favoriteStone}
          onValueChange={(value) => setField("favoriteStone", value)}
          options={[
            { value: "", label: "انتخاب نشده" },
            ...STONE_OPTIONS.map((stone) => ({ value: stone.value, label: stone.label })),
          ]}
          searchable
          searchPlaceholder="جستجوی سنگ"
        />
        <SelectBox
          label="سبک محبوب"
          value={form.favoriteStyle}
          onValueChange={(value) => setField("favoriteStyle", value)}
          options={[
            { value: "", label: "انتخاب نشده" },
            ...styleFilterOptions.map((style) => ({ value: style.value, label: style.label })),
          ]}
        />
        <SelectBox
          label="بودجه محبوب"
          value={form.favoriteBudgetBand}
          onValueChange={(value) => setField("favoriteBudgetBand", value)}
          options={[
            { value: "", label: "انتخاب نشده" },
            ...budgetFilterOptions.map((budget) => ({ value: budget.value, label: budget.label })),
          ]}
        />
      </ProfileFieldGroup>

      <ProfileFieldGroup title="حساب و تماس" description="شناسه ورود و اطلاعات تماس" icon={IdCard}>
        <TextBox
          label="نام کاربری"
          value={formatIranPhoneDisplay(user.phone)}
          readOnly
          inputClassName="auth-input-ltr"
        />
        <TextBox
          label="کد ملی"
          value={form.nationalCode}
          onChange={(e) => setField("nationalCode", normalizeDigits(e.target.value).slice(0, 10))}
          inputClassName="auth-input-ltr"
          placeholder="0123456789"
        />
        <TextBox
          label="تلفن ثابت"
          value={form.landlinePhone}
          onChange={(e) => setField("landlinePhone", normalizeDigits(e.target.value).slice(0, 11))}
          inputClassName="auth-input-ltr"
          placeholder="02112345678"
        />
      </ProfileFieldGroup>

      <ProfileFieldGroup title="آدرس پستی" description="برای ارسال سفارش‌ها" icon={MapPin}>
        <TextBox
          label="استان"
          value={form.province}
          onChange={(e) => setField("province", e.target.value)}
          placeholder="مثلاً تهران"
        />
        <TextBox
          label="شهر"
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="مثلاً تهران"
        />
        <TextBox
          label="کد پستی"
          value={form.postalCode}
          onChange={(e) => setField("postalCode", normalizeDigits(e.target.value).slice(0, 10))}
          inputClassName="auth-input-ltr"
          placeholder="1234567890"
        />
        <div className="account-profile-fields-full">
          <TextAreaBox
            label="آدرس"
            value={form.addressLine}
            onChange={(e) => setField("addressLine", e.target.value)}
            placeholder="آدرس کامل پستی"
          />
        </div>
      </ProfileFieldGroup>

      <div className="account-profile-actions">
        <Button
          type="button"
          size="sm"
          variant="primary"
          isLoading={isSaving}
          disabled={!canSave}
          onClick={() => onSave(form)}
        >
          ذخیره اطلاعات
        </Button>
        <p className="account-profile-actions-hint">
          نام کاربری در این سامانه برابر با شماره موبایل شما است.
        </p>
      </div>
    </div>
  );
}
