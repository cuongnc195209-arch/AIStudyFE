# Yêu cầu backend: API lấy danh sách tài liệu được chia sẻ với tôi

## Vấn đề
`POST /api/v1/documents/{id}/share` đã hoạt động đúng — bản ghi được insert vào bảng
`document_shares` (`document_id`, `shared_with_user_id`, `permission_type`, `shared_at`).

Tuy nhiên `GET /api/v1/documents/all` chỉ trả về tài liệu do user sở hữu, **không gộp**
các tài liệu mà user được người khác chia sẻ (qua bảng `document_shares`). Vì vậy người
được chia sẻ đăng nhập vào không thấy tài liệu đó ở đâu cả.

## Đề xuất
Thêm endpoint mới:

```
GET /api/v1/documents/shared-with-me
Header: X-User-Id (uuid, required) — giống các endpoint khác trong document-controller
```

Query: join `document_shares` (`shared_with_user_id = X-User-Id`) → `documents`
(`document_shares.document_id = documents.id`).

Response: mảng object tài liệu, **cùng shape với từng item trả về bởi `GET /all`**
(để FE tái dùng nguyên logic mapping hiện có), bổ sung thêm 2 field:

```json
[
  {
    "id": "...",
    "documentName": "...",
    "fileType": "...",
    "fileSize": ...,
    "isPublic": false,
    "...": "... (các field khác giống GET /all)",
    "permissionType": "view",       // lấy từ document_shares.permission_type
    "sharedAt": "2026-06-30T08:38:18.714392Z"
  }
]
```

## Thay thế khác (nếu backend muốn gộp luôn thay vì endpoint riêng)
Có thể sửa `GET /api/v1/documents/all` để trả về union (owned + shared), thêm field
`isShared: boolean` hoặc `permissionType` để FE phân biệt. Nếu chọn hướng này, báo lại
để FE điều chỉnh thay vì gọi endpoint riêng.

## Liên hệ
FE đã chuẩn bị sẵn hàm gọi endpoint `/shared-with-me` ở
`src/apis/documentApi.js` (`getSharedDocuments()`) và tab "Được chia sẻ với tôi" ở
trang Tài liệu — chỉ cần backend trả đúng shape trên là chạy được ngay, không cần FE
sửa thêm.
