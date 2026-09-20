// Shim CHỈ cho cổng `npm run check:functions` local (tsc).
// Deploy qua Dashboard → Via Editor chỉ dán nội dung index.ts nên file này
// không ảnh hưởng bundle đang chạy. Không import file này từ index.ts.

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// Import URL (esm.sh) chỉ tồn tại ở Deno runtime; tsc coi mọi export là any.
declare module "https://esm.sh/*";
