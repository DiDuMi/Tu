#!/bin/bash

echo "🧪 测试评论API..."

# 测试游客评论
echo ""
echo "👻 测试游客评论..."
curl -X POST "http://localhost:3000/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments" \
  -H "Content-Type: application/json" \
  -H "X-Guest-Id: test_guest_123" \
  -d '{
    "content": "这是一条curl测试游客评论",
    "isAnonymous": true,
    "nickname": "curl测试游客",
    "email": "curl-test@example.com",
    "guestId": "test_guest_123"
  }' \
  -w "\n状态码: %{http_code}\n" \
  -s

echo ""
echo "📋 获取评论列表..."
curl -X GET "http://localhost:3000/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments?guestId=test_guest_123" \
  -H "X-Guest-Id: test_guest_123" \
  -w "\n状态码: %{http_code}\n" \
  -s

echo ""
echo "✅ 测试完成"
