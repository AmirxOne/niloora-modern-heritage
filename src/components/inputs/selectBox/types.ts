export type SelectBoxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectBoxChangeEvent = {
  target: {
    name?: string;
    value: string;
  };
};

export type SelectBoxBlurEvent = {
  target: {
    name?: string;
  };
};
