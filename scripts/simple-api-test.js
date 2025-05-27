const http = require('http');

function testAPI() {
  console.log('🧪 测试评论API连接...');

  const postData = JSON.stringify({
    content: '这是一条Node.js测试游客评论',
    isAnonymous: true,
    nickname: 'Node.js测试游客',
    email: 'node-test@example.com',
    guestId: 'test_guest_123'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': 'test_guest_123',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('响应数据:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 200) {
          console.log('✅ 游客评论API测试成功');
        } else {
          console.log('❌ 游客评论API测试失败');
        }
      } catch (e) {
        console.log('响应不是有效的JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

testAPI();
