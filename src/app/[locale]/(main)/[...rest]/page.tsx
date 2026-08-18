import { notFound } from "next/navigation";

export default function UnknownMainPathPage() {
  // 정의되지 않은 main 하위 경로는 공통 404 화면으로 보냄
  notFound();
}
