const http = require('http');

console.log('🧪 测试管理员评论审核API...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/admin/comments/review?page=1&limit=20&status=PENDING',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('响应数据:', JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 401) {
        console.log('✅ 正确返回401未授权错误 - API权限控制正常');
      } else {
        console.log('❌ 预期401未授权错误');
      }
    } catch (e) {
      console.log('响应不是有效的JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();
