enum ZIndex {
  imageOverlay = 42,
  panel = 101,
}
export default class GlobalConsts {
  static readonly momentParseString = "YYYY-MM-DDTHH:mm:ss.SSSSSSZZ";
  static readonly momentFormatString = "DD.MM.YYYY HH:mm";
  static readonly momentFormatStringDate = "DD.MM.YYYY";
  static readonly mediaSmall = "@media (max-width: 599px)";
  static readonly mediaMedium = "@media (max-width: 799px)";
  static readonly zIndex = ZIndex;
}
