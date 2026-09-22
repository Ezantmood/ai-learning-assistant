/**
 * NGUỒN DUY NHẤT cho trạng thái các thẻ chức năng trên dashboard.
 * Màn hình không được rải chuỗi 'done'/'partial'/'soon' rời rạc — mọi nhãn
 * và cổng điều hướng đều đọc từ `FEATURE_STATUS` này.
 *
 * CN3/CN4 hoàn thành (kiểm tay Expo Go PDF thật): bấm thẻ vào tab Tài liệu
 * (`/documents`), vùng tóm tắt + hỏi đáp nằm trong `/documents/[id]`.
 * CN5 có màn quét `/scan`; CN6 vào tab Tài liệu, vùng gợi ý ở chi tiết.
 */
export type FeatureStatus = 'done' | 'partial' | 'soon';

export type FeatureRoute = '/notes' | '/documents' | '/scan';

export type FeatureId = '1' | '2' | '3' | '4' | '5' | '6';

export const FEATURE_STATUS: Record<
  FeatureId,
  { route?: FeatureRoute; status: FeatureStatus }
> = {
  '1': { route: '/notes', status: 'done' },
  '2': { route: '/documents', status: 'done' },
  '3': { route: '/documents', status: 'done' },
  '4': { route: '/documents', status: 'done' },
  '5': { route: '/scan', status: 'done' },
  '6': { route: '/documents', status: 'done' },
};
