# کانبان

رابط فارسی با پنج ستون ثابت. داده‌ها در حافظه هستند و با بارگذاری مجدد به نمونه اولیه برمی‌گردند.

```sh
npm install
npm run dev
```

نشانی: http://127.0.0.1:3000

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## انتشار در GitHub Pages

فایل‌های پروژه را در ریشه مخزن `Kanban-test` قرار دهید؛ پوشه‌های `frontend` و `.github` باید کنار هم باشند.
در تنظیمات مخزن، `Settings → Pages → Build and deployment → Source` را روی `GitHub Actions` بگذارید.
با هر push به شاخه `main`، آزمون‌ها و ساخت اجرا و خروجی `frontend/out` منتشر می‌شود. اجرای دستی از تب `Actions` هم ممکن است.

نشانی سایت: `https://nastaran-nourbakhsh1.github.io/Kanban-test/`

ساخت محلی مشابه انتشار:

```sh
GITHUB_PAGES=true npm run build
```

مسیر `/Kanban-test` فقط هنگام ساخت با `GITHUB_PAGES=true` فعال است؛ توسعه محلی همچنان از مسیر `/` استفاده می‌کند.
خروجی استاتیک را با یک وب‌سرور استاتیک سرو کنید؛ `next start` برای این خروجی کاربرد ندارد.
