var coolNames = ['Ralph', 'Skippy', 'Chip', 'Ned', 'Scooter'];
exports.isACoolName = function(name) {
  return coolNames.indexOf(name) !== -1;
}

// 循环依赖测试 https://github.com/leancloud/cloud-code/issues/79
require('cloud/main');
