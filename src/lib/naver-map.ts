let naverMapPromise: Promise<void> | null = null;

export function loadNaverMap() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("NAVER Map은 브라우저에서만 로드할 수 있음"),
    );
  }
  if (window.naver?.maps) return Promise.resolve();
  if (naverMapPromise) return naverMapPromise;

  const keyId = process.env.NEXT_PUBLIC_NAVER_MAP_KEY_ID;
  if (!keyId) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_NAVER_MAP_KEY_ID가 설정되지 않음"),
    );
  }

  naverMapPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-naver-map-sdk]",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("NAVER Map SDK 로드 실패")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.dataset.naverMapSdk = "true";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      naverMapPromise = null;
      reject(new Error("NAVER Map SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });

  return naverMapPromise;
}
