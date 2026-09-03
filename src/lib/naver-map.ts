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
    const script = existing ?? document.createElement("script");
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
    const onError = () => {
      cleanup();
      script.remove();
      reject(new Error("NAVER Map SDK 로드 실패"));
    };
    const onLoad = () => {
      if (!window.naver?.maps) {
        onError();
        return;
      }
      cleanup();
      resolve();
    };
    const timeout = setTimeout(onError, 15000);
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (existing) return;
    script.dataset.naverMapSdk = "true";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(keyId)}`;
    script.async = true;
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    naverMapPromise = null;
    throw error;
  });

  return naverMapPromise;
}
