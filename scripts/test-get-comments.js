const http = require('http');

function testGetCommentsAPI() {
  console.log('🧪 测试获取评论列表API...');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments?guestId=test_guest_123',
    method: 'GET',
    headers: {
      'X-Guest-Id': 'test_guest_123'
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
        console.log(`评论数量: ${jsonData.data?.length || 0}`);
        
        if (jsonData.data && jsonData.data.length > 0) {
          console.log('最新评论:');
          const latestComment = jsonData.data[0];
          console.log(`- ID: ${latestComment.id}`);
          console.log(`- 内容: ${latestComment.content}`);
          console.log(`- 状态: ${latestComment.status}`);
          console.log(`- 昵称: ${latestComment.nickname || '无'}`);
          console.log(`- 游客ID: ${latestComment.guestId || '无'}`);
        }
        
        if (res.statusCode === 200) {
          console.log('✅ 获取评论列表API测试成功');
        } else {
          console.log('❌ 获取评论列表API测试失败');
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
}

testGetCommentsAPI();
