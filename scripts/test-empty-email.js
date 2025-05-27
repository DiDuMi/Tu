const http = require('http');

function testEmptyEmailAPI() {
  console.log('🧪 测试空邮箱游客评论API...');

  const postData = JSON.stringify({
    content: '这是一条空邮箱测试游客评论',
    isAnonymous: true,
    nickname: '空邮箱测试游客',
    email: '', // 空邮箱
    guestId: 'test_empty_email_' + Date.now()
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': 'test_empty_email_' + Date.now(),
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);

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
          console.log('✅ 空邮箱游客评论API测试成功');
        } else {
          console.log('❌ 空邮箱游客评论API测试失败');
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

function testNoEmailAPI() {
  console.log('\n🧪 测试无邮箱字段游客评论API...');

  const postData = JSON.stringify({
    content: '这是一条无邮箱字段测试游客评论',
    isAnonymous: true,
    nickname: '无邮箱字段测试游客',
    // 不包含email字段
    guestId: 'test_no_email_' + Date.now()
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': 'test_no_email_' + Date.now(),
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);

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
          console.log('✅ 无邮箱字段游客评论API测试成功');
        } else {
          console.log('❌ 无邮箱字段游客评论API测试失败');
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

// 运行测试
testEmptyEmailAPI();
setTimeout(() => {
  testNoEmailAPI();
}, 1000);
