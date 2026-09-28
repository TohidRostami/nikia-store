/**
 * Demo catalog for a women's clothing store — mirrors the products shown
 * in the Nikia design. Replace/extend from the admin panel; this file is
 * only used by `npm run db:seed` on a development database.
 */

export const CATEGORIES = [
  { slug: "manto", title: "مانتو", description: "مانتوهای کتان و کرپ برای محیط کار و استایل روزمره", sortOrder: 1 },
  { slug: "shomiz", title: "شومیز", description: "شومیزهای ساتن و لینن با دوخت تمیز", sortOrder: 2 },
  { slug: "tshirt", title: "تیشرت", description: "تیشرت‌های نخی بیسیک و اورسایز", sortOrder: 3 },
  { slug: "dress", title: "پیراهن", description: "پیراهن‌های میدی و بلند برای هر مناسبت", sortOrder: 4 },
  { slug: "jeans", title: "شلوار جین", description: "جین‌های راسته و مام‌فیت با فرم دقیق", sortOrder: 5 },
  { slug: "skirt", title: "دامن", description: "دامن‌های پلیسه و جین میدی", sortOrder: 6 },
] as const;

// Iranian women's sizing. Names are stored with Latin digits and shown
// with Persian digits by the storefront.
export const SIZES = [
  { name: "36", description: "دور سینه ۸۸ · دور کمر ۷۰ · قد ۱۰۸", sortOrder: 1 },
  { name: "38", description: "دور سینه ۹۲ · دور کمر ۷۴ · قد ۱۱۰", sortOrder: 2 },
  { name: "40", description: "دور سینه ۹۶ · دور کمر ۷۸ · قد ۱۱۲", sortOrder: 3 },
  { name: "42", description: "دور سینه ۱۰۰ · دور کمر ۸۲ · قد ۱۱۴", sortOrder: 4 },
  { name: "44", description: "دور سینه ۱۰۴ · دور کمر ۸۶ · قد ۱۱۶", sortOrder: 5 },
  { name: "46", description: "دور سینه ۱۰۸ · دور کمر ۹۰ · قد ۱۱۸", sortOrder: 6 },
] as const;

const C = {
  black: { name: "مشکی", hex: "#161412" },
  white: { name: "سفید", hex: "#FFFFFF" },
  cream: { name: "کرم", hex: "#D9CBB5" },
  brown: { name: "قهوه‌ای", hex: "#8C6A4F" },
  jean: { name: "آبی جین", hex: "#5B6B80" },
  navy: { name: "سرمه‌ای", hex: "#2B3440" },
  wine: { name: "زرشکی", hex: "#7B2E2E" },
  olive: { name: "زیتونی", hex: "#3B3A2E" },
  ivory: { name: "شیری", hex: "#F2EDE6" },
  beige: { name: "بژ", hex: "#B9A58C" },
  sand: { name: "نخودی", hex: "#C9B8A0" },
  sky: { name: "آبی روشن", hex: "#8DA0B8" },
} as const;

export type SeedProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  colors: { name: string; hex: string }[];
  /** Average rating the demo reviews are generated around. */
  rating: number;
  description: string;
  materialCare: string;
};

const CARE_COTTON =
  "پارچه: ۱۰۰٪ کتان. شست‌وشو با دست یا ماشین در دمای ۳۰ درجه، اتو با حرارت متوسط. از سفیدکننده استفاده نکنید.";
const CARE_SATIN =
  "پارچه: ساتن ویسکوز. شست‌وشو با دست در آب سرد، بدون چلاندن. اتو با حرارت کم از پشت پارچه.";
const CARE_JEAN =
  "پارچه: ۹۸٪ کتان و ۲٪ الاستان. برای حفظ رنگ، وارونه و در دمای ۳۰ درجه شسته شود. اتو با حرارت متوسط.";
const CARE_KNIT =
  "پارچه: ۱۰۰٪ نخ پنبه‌ای. شست‌وشو در دمای ۳۰ درجه، خشک‌کردن در سایه. اتو ضروری نیست.";

export const PRODUCTS: SeedProduct[] = [
  {
    slug: "long-linen-manto", name: "مانتو کتان بلند", categorySlug: "manto",
    price: 2490000, isNew: true, isFeatured: true, rating: 4.8,
    colors: [C.cream, C.black, C.brown],
    description: "یقه ساده، آستین بلند با سردست دکمه‌دار و جیب‌های پنهان در درز پهلو. قد و فرم این مدل برای استایل روزمره و رسمی طراحی شده است.",
    materialCare: CARE_COTTON,
  },
  {
    slug: "satin-english-collar-shirt", name: "شومیز ساتن یقه‌انگلیسی", categorySlug: "shomiz",
    price: 1290000, isFeatured: true, rating: 4.7,
    colors: [C.ivory, C.black],
    description: "شومیز ساتن با یقه انگلیسی و دکمه‌های صدفی. سقوط نرم پارچه، هم زیر مانتو و هم به‌تنهایی زیبا می‌نشیند.",
    materialCare: CARE_SATIN,
  },
  {
    slug: "basic-cotton-tee", name: "تیشرت نخی بیسیک", categorySlug: "tshirt",
    price: 590000, compareAtPrice: 790000, isFeatured: true, rating: 4.6,
    colors: [C.black, C.white, C.beige],
    description: "تیشرت ساده و خوش‌فرم از نخ پنبه‌ای نرم؛ پایه‌ی هر ست روزمره.",
    materialCare: CARE_KNIT,
  },
  {
    slug: "pleated-midi-dress", name: "پیراهن میدی پلیسه", categorySlug: "dress",
    price: 1890000, compareAtPrice: 2400000, isFeatured: true, rating: 4.9,
    colors: [C.black, C.wine],
    description: "پیراهن میدی با پلیسه‌های ریز و کمر مدل‌دار. سبک و راحت، مناسب مهمانی و محیط کار.",
    materialCare: CARE_SATIN,
  },
  {
    slug: "straight-high-rise-jeans", name: "شلوار جین راسته فاق‌بلند", categorySlug: "jeans",
    price: 1450000, isFeatured: true, rating: 4.7,
    colors: [C.jean, C.navy],
    description: "جین راسته با فاق بلند و پارچه‌ی کمی کش‌دار؛ فرمی که با هر بار پوشیدن راحت‌تر می‌شود.",
    materialCare: CARE_JEAN,
  },
  {
    slug: "long-pleated-skirt", name: "دامن پلیسه بلند", categorySlug: "skirt",
    price: 980000, isNew: true, isFeatured: true, rating: 4.5,
    colors: [C.cream, C.black],
    description: "دامن بلند پلیسه با کمر کش‌دار و آستر داخلی. حرکت روان پارچه، حس سبکی می‌دهد.",
    materialCare: CARE_SATIN,
  },
  {
    slug: "single-button-crepe-manto", name: "مانتو تک‌دکمه کرپ", categorySlug: "manto",
    price: 2190000, compareAtPrice: 2690000, rating: 4.8,
    colors: [C.brown, C.cream],
    description: "مانتوی کرپ با بستن تک‌دکمه، یقه چرچیلی و فرم صاف. ریخت پارچه بدون چروک‌افتادگی زیاد.",
    materialCare: CARE_SATIN,
  },
  {
    slug: "puff-sleeve-linen-shirt", name: "شومیز لینن آستین‌پفی", categorySlug: "shomiz",
    price: 1150000, rating: 4.6,
    colors: [C.white, C.sand],
    description: "شومیز لینن با آستین‌های پفی و سردست کش. نفس‌کش و خنک، مناسب فصل‌های گرم.",
    materialCare: CARE_COTTON,
  },
  {
    slug: "long-satin-dress", name: "پیراهن بلند ساتن", categorySlug: "dress",
    price: 2350000, isNew: true, rating: 4.9,
    colors: [C.olive, C.cream],
    description: "پیراهن بلند ساتن با یقه هفت و کمربند هم‌جنس. برای مراسم‌ها و شب‌های خاص.",
    materialCare: CARE_SATIN,
  },
  {
    slug: "mom-fit-jeans", name: "شلوار جین مام‌فیت", categorySlug: "jeans",
    price: 1350000, compareAtPrice: 1590000, rating: 4.6,
    colors: [C.sky, C.jean],
    description: "جین مام‌فیت با کمر بالا و پاچه‌ی کمی گشاد؛ راحت و شیک.",
    materialCare: CARE_JEAN,
  },
  {
    slug: "oversize-crew-tee", name: "تیشرت اورسایز یقه‌گرد", categorySlug: "tshirt",
    price: 690000, rating: 4.7,
    colors: [C.ivory, C.black, C.brown],
    description: "تیشرت اورسایز با شانه‌ی افتاده و یقه‌ی گرد. پارچه‌ی ضخیم‌تر، فرم ثابت.",
    materialCare: CARE_KNIT,
  },
  {
    slug: "denim-midi-skirt", name: "دامن جین میدی", categorySlug: "skirt",
    price: 1090000, rating: 4.5,
    colors: [C.jean],
    description: "دامن جین میدی با چاک جلو و کمر بلند. با شومیز و کفش ساده ست می‌شود.",
    materialCare: CARE_JEAN,
  },
];

export const DEMO_REVIEWERS = [
  "سارا محمدی", "مریم احمدی", "نگار رضایی", "الهام کریمی", "ترانه صادقی",
];

export const DEMO_COMMENTS = [
  "دوخت و پارچه عالیه، دقیقا مثل عکس بود.",
  "سایزبندی درسته، راحت و خوش‌فرم.",
  "بسته‌بندی تمیز و ارسال سریع بود.",
  "کیفیت نسبت به قیمت خیلی خوبه.",
  "رنگش توی واقعیت قشنگ‌تر از عکسه.",
  "برای استفاده روزمره عالیه.",
];
