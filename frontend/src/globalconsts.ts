enum ZIndex {
  imageOverlay = 42,
  panel = 101,
}
export default class GlobalConsts {
  static readonly dateFNSFormatString = "dd.MM.yyyy HH:mm";
  static readonly dateFNSFormatStringDate = "dd.MM.yyyy";
  static readonly mediaSmall = "@media (max-width: 599px)";
  static readonly mediaMedium = "@media (max-width: 799px)";
  static readonly zIndex = ZIndex;
}
