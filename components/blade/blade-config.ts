export type BladeType = "view" | "edit"

export const BLADE_TYPE_WIDTHS: Record<BladeType, string> = {
  view: "w-full md:w-full lg:w-full xl:w-[90vw] 2xl:w-[80vw]",
  edit: "w-full md:w-[90vw] lg:w-[80vw] xl:w-[70vw] 2xl:w-[60vw]",
}
