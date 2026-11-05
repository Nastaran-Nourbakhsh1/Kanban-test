export type Card = { id: string; title: string; details: string };
export type Column = { id: string; name: string; cards: Card[] };
export type Action =
  | { type: "add"; columnId: string; card: Card }
  | { type: "delete"; cardId: string }
  | { type: "rename"; columnId: string; name: string }
  | { type: "move"; cardId: string; columnId: string; index?: number };

export function boardReducer(state: Column[], action: Action): Column[] {
  if (action.type === "rename") {
    if (!action.name.trim()) return state;
    return state.map((c) =>
      c.id === action.columnId ? { ...c, name: action.name.trim() } : c,
    );
  }
  if (action.type === "add") {
    if (!action.card.title.trim()) return state;
    return state.map((c) =>
      c.id === action.columnId
        ? {
            ...c,
            cards: [
              ...c.cards,
              { ...action.card, title: action.card.title.trim() },
            ],
          }
        : c,
    );
  }
  if (action.type === "delete")
    return state.map((c) => ({
      ...c,
      cards: c.cards.filter((card) => card.id !== action.cardId),
    }));
  const card = state
    .flatMap((c) => c.cards)
    .find((c) => c.id === action.cardId);
  if (!card || !state.some((c) => c.id === action.columnId)) return state;
  return state.map((c) => {
    const cards = c.cards.filter((item) => item.id !== card.id);
    if (c.id === action.columnId)
      cards.splice(action.index ?? cards.length, 0, card);
    return { ...c, cards };
  });
}

export function initialBoard(): Column[] {
  const content = [
    [
      "ایده‌ها",
      [
        "تجربه‌ای ساده‌تر برای شروع",
        "مسیر اولین ورود کاربر را مرور کنیم و قدم‌های غیرضروری را کنار بگذاریم.",
      ],
      [
        "الهام برای هویت بصری",
        "جمع‌آوری چند نمونه از ترکیب رنگ، تایپوگرافی و جزئیات رابط کاربری.",
      ],
    ],
    [
      "برای انجام",
      [
        "طراحی صفحه معرفی",
        "ساختار محتوا و طرح اولیه صفحه معرفی محصول آماده شود.",
      ],
      [
        "نوشتن متن‌های رابط کاربری",
        "متن دکمه‌ها و پیام‌ها کوتاه، روشن و یکدست باشند.",
      ],
    ],
    [
      "در حال انجام",
      [
        "طراحی تخته کانبان",
        "تمرکز روی خوانایی کارت‌ها، فاصله‌گذاری و جابه‌جایی روان بین ستون‌ها.",
      ],
      [
        "ساخت کتابخانه رنگ",
        "رنگ‌های اصلی و کاربرد هرکدام در رابط کاربری مشخص شوند.",
      ],
    ],
    [
      "در حال بررسی",
      [
        "بازبینی نسخه موبایل",
        "نمایش کارت‌ها و دسترسی به دکمه‌ها روی صفحه‌های کوچک بررسی شود.",
      ],
    ],
    [
      "انجام‌شده",
      [
        "تعریف مسیر پروژه",
        "نیازهای نسخه اولیه مشخص شد؛ یک تخته ساده برای تمرکز روی کارهای مهم.",
      ],
      [
        "آماده‌سازی ساختار اولیه",
        "ساختار پروژه و ابزارهای اصلی توسعه آماده شدند.",
      ],
    ],
  ] as const;
  return content.map(([name, ...cards], i) => ({
    id: `column-${i}`,
    name,
    cards: cards.map(([title, details], j) => ({
      id: `card-${i}-${j}`,
      title,
      details,
    })),
  }));
}
