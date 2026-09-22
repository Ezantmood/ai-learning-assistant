/**
 * NGUỒN DUY NHẤT cho trạng thái các thẻ chức năng trên dashboard.
 * Màn hình không được rải chuỗi 'done'/'partial'/'soon' rời rạc — mọi nhãn
 * và cổng điều hướng đều đọc từ `FEATURE_STATUS` này.
 *
 * CN3/CN4 hoàn thành (kiểm tay Expo Go PDF thật): bấm thẻ vào tab Tài liệu
 * (`/documents`), vùng tóm tắt + hỏi đáp nằm trong `/documents/[id]`.
 * CN5/CN6 vẫn đang làm: giữ 'soon', không route, bấm báo đang phát triển.
 */
export type FeatureStatus = 'done' | 'partial' | 'soon';

export type FeatureRoute = '/notes' | '/documents';

export type FeatureId = '1' | '2' | '3' | '4' | '5' | '6';

export const FEATURE_STATUS: Record<
  FeatureId,
  { route?: FeatureRoute; status: FeatureStatus }
> = {
  '1': { route: '/notes', status: 'done' },
  '2': { route: '/documents', status: 'done' },
  '3': { route: '/documents', status: 'done' },
  '4': { route: '/documents', status: 'done' },
  '5': { status: 'soon' },
  '6': { status: 'soon' },
};
