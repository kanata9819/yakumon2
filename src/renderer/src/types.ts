export type RecognizedText = {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

export type TranslatedText = RecognizedText & {
  translated: string;
};
