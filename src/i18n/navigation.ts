import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/*
 * next/navigation을 직접 사용하는 대신 locale 정보를 유지함
 * next-intl의 Navigation API를 프로젝트 공통으로 사용함
 */
export const { Link, usePathname, useRouter } = createNavigation(routing);
