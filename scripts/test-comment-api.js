const fetch = require('node-fetch');

async function testCommentAPI() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🧪 测试评论API...\n');

    // 1. 测试游客评论
    console.log('👻 测试游客评论API...');
    
    const guestCommentData = {
      content: '这是一条API测试游客评论',
      isAnonymous: true,
      nickname: 'API测试游客',
      email: 'api-test@example.com',
      guestId: 'api_test_guest_' + Date.now(),
    };

    console.log('发送数据:', JSON.stringify(guestCommentData, null, 2));

    const guestResponse = await fetch(`${baseURL}/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Id': guestCommentData.guestId,
      },
      body: JSON.stringify(guestCommentData),
    });

    console.log('响应状态:', guestResponse.status);
    const guestResult = await guestResponse.json();
    console.log('响应数据:', JSON.stringify(guestResult, null, 2));

    if (guestResponse.ok) {
      console.log('✅ 游客评论API测试成功');
    } else {
      console.log('❌ 游客评论API测试失败');
    }

    // 2. 测试注册用户评论（需要登录）
    console.log('\n👤 测试注册用户评论API...');
    console.log('注意：此测试需要有效的session cookie，可能会失败');

    const userCommentData = {
      content: '这是一条API测试注册用户评论',
      isAnonymous: false,
    };

    console.log('发送数据:', JSON.stringify(userCommentData, null, 2));

    const userResponse = await fetch(`${baseURL}/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCommentData),
    });

    console.log('响应状态:', userResponse.status);
    const userResult = await userResponse.json();
    console.log('响应数据:', JSON.stringify(userResult, null, 2));

    if (userResponse.ok) {
      console.log('✅ 注册用户评论API测试成功');
    } else {
      console.log('❌ 注册用户评论API测试失败（可能是因为未登录）');
    }

    // 3. 测试获取评论列表
    console.log('\n📋 测试获取评论列表API...');

    const listResponse = await fetch(`${baseURL}/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments?guestId=${guestCommentData.guestId}`, {
      method: 'GET',
      headers: {
        'X-Guest-Id': guestCommentData.guestId,
      },
    });

    console.log('响应状态:', listResponse.status);
    const listResult = await listResponse.json();
    console.log('评论数量:', listResult.data?.length || 0);

    if (listResponse.ok) {
      console.log('✅ 获取评论列表API测试成功');
    } else {
      console.log('❌ 获取评论列表API测试失败');
    }

  } catch (error) {
    console.error('❌ API测试过程中发生错误:', error);
  }
}

// 检查是否安装了node-fetch
try {
  require('node-fetch');
  testCommentAPI();
} catch (e) {
  console.log('请先安装node-fetch: npm install node-fetch');
  console.log('或者使用curl命令测试API');
}
