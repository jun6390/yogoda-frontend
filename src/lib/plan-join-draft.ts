/*
 * 요금제 상세 페이지에서 선택한 혜택을 확인 페이지로 넘길 때 사용하는 sessionStorage 키
 * 요금제 코드마다 별도로 저장해 여러 탭/뒤로가기 상황에서 다른 요금제 선택값과 섞이지 않게 함
 */
export function getPlanJoinDraftKey(code: string) {
  return `plan-join-draft:${code}`;
}
