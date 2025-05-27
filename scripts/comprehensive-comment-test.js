const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🧪 开始综合评论功能测试...\n');

  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const tests = [
    {
      name: '游客评论 - 有邮箱',
      data: {
        content: '这是一条有邮箱的游客评论',
        isAnonymous: true,
        nickname: '有邮箱游客',
        email: 'guest@example.com',
        guestId: 'test_with_email_' + Date.now()
      }
    },
    {
      name: '游客评论 - 空邮箱',
      data: {
        content: '这是一条空邮箱的游客评论',
        isAnonymous: true,
        nickname: '空邮箱游客',
        email: '',
        guestId: 'test_empty_email_' + Date.now()
      }
    },
    {
      name: '游客评论 - 无邮箱字段',
      data: {
        content: '这是一条无邮箱字段的游客评论',
        isAnonymous: true,
        nickname: '无邮箱游客',
        guestId: 'test_no_email_' + Date.now()
      }
    },
    {
      name: '游客评论 - 无昵称（应该失败）',
      data: {
        content: '这是一条无昵称的游客评论',
        isAnonymous: true,
        email: 'noname@example.com',
        guestId: 'test_no_nickname_' + Date.now()
      },
      expectFail: true
    },
    {
      name: '游客评论 - 无内容（应该失败）',
      data: {
        content: '',
        isAnonymous: true,
        nickname: '无内容游客',
        guestId: 'test_no_content_' + Date.now()
      },
      expectFail: true
    },
    {
      name: '游客评论 - 错误邮箱格式（应该失败）',
      data: {
        content: '这是一条错误邮箱格式的游客评论',
        isAnonymous: true,
        nickname: '错误邮箱游客',
        email: 'invalid-email',
        guestId: 'test_invalid_email_' + Date.now()
      },
      expectFail: true
    },
    {
      name: '注册用户评论 - 无session（应该失败）',
      data: {
        content: '这是一条注册用户评论',
        isAnonymous: false,
      },
      expectFail: true
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`📝 测试 ${i + 1}/${totalTests}: ${test.name}`);

    try {
      const postData = JSON.stringify(test.data);
      const options = {
        ...baseOptions,
        method: 'POST',
        headers: {
          ...baseOptions.headers,
          'Content-Length': Buffer.byteLength(postData),
          'X-Guest-Id': test.data.guestId || ''
        }
      };

      const result = await makeRequest(options, postData);
      
      const isSuccess = result.statusCode === 200;
      const shouldFail = test.expectFail || false;

      if ((isSuccess && !shouldFail) || (!isSuccess && shouldFail)) {
        console.log(`   ✅ 通过 (状态码: ${result.statusCode})`);
        passedTests++;
      } else {
        console.log(`   ❌ 失败 (状态码: ${result.statusCode})`);
        if (result.data.error) {
          console.log(`   错误: ${result.data.error.message}`);
        }
      }

      // 如果是成功的评论创建，显示评论ID
      if (isSuccess && result.data.data && result.data.data.id) {
        console.log(`   评论ID: ${result.data.data.id}`);
      }

    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
    }

    console.log(''); // 空行分隔
  }

  // 测试获取评论列表
  console.log('📋 测试获取评论列表...');
  try {
    const options = {
      ...baseOptions,
      method: 'GET',
      path: baseOptions.path + '?guestId=test_guest_123',
      headers: {
        'X-Guest-Id': 'test_guest_123'
      }
    };

    const result = await makeRequest(options);
    
    if (result.statusCode === 200) {
      console.log(`   ✅ 获取评论列表成功`);
      console.log(`   评论数量: ${result.data.data?.length || 0}`);
      passedTests++;
    } else {
      console.log(`   ❌ 获取评论列表失败 (状态码: ${result.statusCode})`);
    }
    totalTests++;
  } catch (error) {
    console.log(`   ❌ 获取评论列表请求失败: ${error.message}`);
    totalTests++;
  }

  console.log('\n🎯 测试结果总结:');
  console.log(`通过: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！评论系统功能正常。');
  } else {
    console.log('⚠️ 部分测试失败，请检查相关功能。');
  }
}

runComprehensiveTest().catch(console.error);
