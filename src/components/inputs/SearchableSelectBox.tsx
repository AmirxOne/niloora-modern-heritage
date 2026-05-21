"use client";

import SelectBox, { type SelectBoxProps } from "./SelectBox";

function SearchableSelectBox(props: Omit<SelectBoxProps, "searchable">) {
  return <SelectBox {...props} searchable />;
}

SearchableSelectBox.displayName = "SearchableSelectBox";

export default SearchableSelectBox;
export type { SelectBoxProps, SelectBoxOption } from "./SelectBox";
